/* ─────────────────────────────────────────────────────────
 * DelegAI — Delegator Module
 * Smart account creation + delegation chain management
 * ───────────────────────────────────────────────────────── */

import type { Delegation, Caveat, Eip7702Authorization } from './types';
import {
  IS_DEMO,
  DEMO_ADDRESSES,
  toUsdcRaw,
  ROOT_BUDGET_USDC,
  ROOT_MAX_CALLS,
  CHAIN_ID,
  USDC_ADDRESS,
  WORKER_BUDGET_USDC,
  RPC_URL,
} from './constants';
import { createMockDelegationChain } from './mock-data';

// ── Live-mode SDK imports (server-side only) ─────────────

type SdkDelegation = {
  delegate: `0x${string}`;
  delegator: `0x${string}`;
  authority: `0x${string}`;
  caveats: { enforcer: `0x${string}`; terms: `0x${string}`; args: `0x${string}` }[];
  salt: `0x${string}`;
  signature: `0x${string}`;
};

// Module-level store maps local delegation IDs → signed SDK delegations
// Used for sub-delegation creation (needs full parent object)
const _delegationStore = new Map<string, SdkDelegation>();

/** @internal — Exposed for E2E test scripts only. Do NOT use in production code. */
export function _getDelegationStore(): Map<string, SdkDelegation> {
  return _delegationStore;
}

function randomSalt(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

function getPrivateKey(role: string): `0x${string}` {
  const keyMap: Record<string, string | undefined> = {
    user: process.env.PRIVATE_KEY_USER,
    master: process.env.PRIVATE_KEY_MASTER,
    'data-worker': process.env.PRIVATE_KEY_DATA_WORKER,
    'exec-worker': process.env.PRIVATE_KEY_EXEC_WORKER,
  };
  const envName = `PRIVATE_KEY_${role.toUpperCase().replace(/-/g, '_')}`;
  const key = keyMap[role];
  if (!key) throw new Error(`Missing env ${envName}`);
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(`Invalid ${envName}: must be a 0x-prefixed 32-byte hex string (64 hex chars)`);
  }
  return key as `0x${string}`;
}

async function liveSign(
  delegation: Omit<SdkDelegation, 'signature'>,
  signerRole: string
): Promise<SdkDelegation> {
  const { signDelegation, getSmartAccountsEnvironment } = await import('@metamask/smart-accounts-kit');
  const { hashDelegation } = await import('@metamask/delegation-core');
  const env = getSmartAccountsEnvironment(CHAIN_ID);
  const privateKey = getPrivateKey(signerRole);
  const signature = await signDelegation({
    privateKey,
    delegation: delegation as Omit<SdkDelegation, 'signature'> & { salt: `0x${string}`; signature: never },
    delegationManager: env.DelegationManager,
    chainId: CHAIN_ID,
    allowInsecureUnrestrictedDelegation: true,
  });
  const signed = { ...delegation, signature } as SdkDelegation;
  const id = hashDelegation(signed as unknown as Parameters<typeof hashDelegation>[0]);
  _delegationStore.set(id, signed);
  return signed;
}

function sdkDelegToLocal(sdk: SdkDelegation, id: string, parentDelegation?: string): Delegation {
  return {
    id,
    delegator: sdk.delegator,
    delegate: sdk.delegate,
    caveats: [],
    salt: sdk.salt,
    parentDelegation,
    signature: sdk.signature,
    status: 'active',
    createdAt: Date.now(),
  };
}

/**
 * Compute the counterfactual HybridDeleGator address for the user role.
 * The delegator in ERC-7710 must be a smart contract so the DelegationManager
 * can call execute() on it. For all other roles we return the raw EOA — they
 * only sign intermediate sub-delegations verified via ECDSA, not called for execution.
 */
async function getUserSmartAccountAddr(): Promise<`0x${string}`> {
  const { getSmartAccountsEnvironment, contracts } = await import('@metamask/smart-accounts-kit');
  const { privateKeyToAccount } = await import('viem/accounts');
  const { getContractAddress, pad } = await import('viem');

  const eoaAddr = privateKeyToAccount(getPrivateKey('user')).address;
  const env = getSmartAccountsEnvironment(CHAIN_ID);

  const initcode = contracts.HybridDeleGator.encode.initializeHybridDeleGator({
    eoaOwner: eoaAddr,
    p256Owners: [],
  });
  const proxyCreationCode = contracts.encodeProxyCreationCode({
    implementationAddress: env.implementations.HybridDeleGatorImpl as `0x${string}`,
    initcode,
  });
  const salt = pad('0x0', { dir: 'left', size: 32 });
  return getContractAddress({
    bytecode: proxyCreationCode,
    from: env.SimpleFactory as `0x${string}`,
    opcode: 'CREATE2',
    salt,
  });
}

/**
 * Return the Ethereum address for an agent role.
 * Live mode — user: HybridDeleGator counterfactual address (needed for execution).
 *             others: raw EOA (intermediate signers, ECDSA-verified by DelegationManager).
 * Demo: returns deterministic placeholder.
 */
export async function createSmartAccount(role: string): Promise<string> {
  if (IS_DEMO) {
    const addressMap: Record<string, string> = {
      user: DEMO_ADDRESSES.user,
      master: DEMO_ADDRESSES.master,
      'data-worker': DEMO_ADDRESSES.dataWorker,
      'exec-worker': DEMO_ADDRESSES.execWorker,
    };
    return addressMap[role] || `0x${role}...demo`;
  }

  if (role === 'user') return getUserSmartAccountAddr();

  const { privateKeyToAccount } = await import('viem/accounts');
  const privateKey = getPrivateKey(role);
  const account = privateKeyToAccount(privateKey);
  return account.address;
}

/**
 * Create and sign the root delegation from user → master agent.
 * Live: real ERC-7710 delegation with Erc20TransferAmount scope.
 * Demo: mock root delegation.
 */
export async function requestPermissions(rootBudget = ROOT_BUDGET_USDC, rootMaxCalls = ROOT_MAX_CALLS): Promise<Delegation> {
  if (IS_DEMO) {
    const chain = createMockDelegationChain();
    return chain.root;
  }

  const { createDelegation, getSmartAccountsEnvironment, ScopeType } = await import(
    '@metamask/smart-accounts-kit'
  );
  const { hashDelegation } = await import('@metamask/delegation-core');
  const { privateKeyToAccount } = await import('viem/accounts');

  const env = getSmartAccountsEnvironment(CHAIN_ID);
  const masterKey = getPrivateKey('master');
  // userAddr must be the deployed HybridDeleGator — DelegationManager calls execute() on it.
  // The EOA private key still signs the delegation (HybridDeleGator validates via isValidSignature).
  const userAddr = await getUserSmartAccountAddr();
  const masterAddr = privateKeyToAccount(masterKey).address;

  void rootMaxCalls; // LimitedCalls caveat on root not supported in SDK scope shorthand

  const delegation = createDelegation({
    environment: env,
    from: userAddr,
    to: masterAddr,
    salt: randomSalt(),
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: USDC_ADDRESS,
      maxAmount: BigInt(toUsdcRaw(rootBudget)),
    },
  }) as SdkDelegation;

  const signed = await liveSign(delegation, 'user');
  const id = hashDelegation(signed as unknown as Parameters<typeof hashDelegation>[0]);

  return sdkDelegToLocal(signed, id, undefined);
}

/**
 * Create a sub-delegation with caveats.
 * Live: real delegation linked to parent via ERC-7710 authority chain.
 * Demo: mock delegation with fake signature.
 */
export async function createDelegationWithCaveats(params: {
  delegator: string;
  delegate: string;
  caveats: Caveat[];
  parentDelegation?: string;
  signerRole?: string;
}): Promise<Delegation> {
  if (IS_DEMO) {
    return {
      id: `deleg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      delegator: params.delegator,
      delegate: params.delegate,
      caveats: params.caveats,
      salt: `0x${Date.now().toString(16)}`,
      parentDelegation: params.parentDelegation,
      signature: `0xmocksig_${Date.now()}`,
      status: 'active',
      createdAt: Date.now(),
    };
  }

  const { createDelegation, getSmartAccountsEnvironment, CaveatType } = await import(
    '@metamask/smart-accounts-kit'
  );
  const { createCaveatBuilder } = await import('@metamask/smart-accounts-kit/utils');
  const { hashDelegation } = await import('@metamask/delegation-core');
  const { privateKeyToAccount } = await import('viem/accounts');

  const env = getSmartAccountsEnvironment(CHAIN_ID);
  const signerRole = params.signerRole || 'master';
  const delegatorKey = getPrivateKey(signerRole);
  const delegatorAddr = privateKeyToAccount(delegatorKey).address as `0x${string}`;
  const delegateAddr = params.delegate as `0x${string}`;

  const parentSdk = params.parentDelegation ? _delegationStore.get(params.parentDelegation) : undefined;

  // Build caveats using createCaveatBuilder for type-safe, enforcer-resolved caveat encoding
  const caveatBuilder = createCaveatBuilder(env);
  for (const c of params.caveats) {
    if (c.type === 'Erc20TransferAmount') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caveatBuilder.addCaveat(CaveatType.Erc20TransferAmount as any, {
        tokenAddress: USDC_ADDRESS,
        maxAmount: BigInt(c.value as string),
      });
    } else if (c.type === 'LimitedCalls') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caveatBuilder.addCaveat(CaveatType.LimitedCalls as any, { limit: Number(c.value) });
    } else if (c.type === 'Redeemer') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caveatBuilder.addCaveat(CaveatType.Redeemer as any, { redeemers: [c.value as `0x${string}`] });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createDelegationAny = createDelegation as (opts: any) => SdkDelegation;
  const salt = randomSalt();
  const delegation = parentSdk
    ? createDelegationAny({
        environment: env,
        from: delegatorAddr,
        to: delegateAddr,
        parentDelegation: parentSdk,
        caveats: caveatBuilder,
        salt,
      })
    : createDelegationAny({
        environment: env,
        from: delegatorAddr,
        to: delegateAddr,
        salt,
        scope: {
          type: 'erc20TransferAmount',
          tokenAddress: USDC_ADDRESS,
          maxAmount: BigInt(toUsdcRaw(WORKER_BUDGET_USDC)),
        },
        caveats: caveatBuilder,
      });

  const signed = await liveSign(delegation, signerRole);
  const id = hashDelegation(signed as unknown as Parameters<typeof hashDelegation>[0]);

  return sdkDelegToLocal(signed, id, params.parentDelegation);
}

/**
 * Settle the delegation chain by submitting via 1Shot relay.
 * Returns the relay taskId (undefined in demo mode).
 */
export async function settleDelegationChain(delegationId: string): Promise<string | undefined> {
  if (IS_DEMO) {
    console.log(`[Demo] Delegation chain ${delegationId} settled`);
    return undefined;
  }

  const { encodeDelegations } = await import('@metamask/delegation-core');
  const { encodeExecutionCalldata } = await import(
    '@metamask/smart-accounts-kit/utils'
  );
  const { encodeFunctionData, createPublicClient, createWalletClient, http } = await import('viem');
  const { privateKeyToAccount } = await import('viem/accounts');
  const { sepolia } = await import('viem/chains');
  const { getSmartAccountsEnvironment } = await import('@metamask/smart-accounts-kit');
  const { DelegationManager: DM_ABI } = await import('@metamask/delegation-abis');

  const sdkDeleg = _delegationStore.get(delegationId);
  if (!sdkDeleg) {
    // Fallback: no delegation in store, can't build chain
    console.error('[settleDelegationChain] No delegation found for ID:', delegationId);
    return undefined;
  }

  // Build chain [leaf, ..., root] — the DelegationManager checks delegations[0].delegate == msg.sender
  // so the leaf (exec) delegation must be first, root last.
  const ROOT_AUTHORITY = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  const chain: SdkDelegation[] = [sdkDeleg];
  let current = sdkDeleg;
  while (current.authority && current.authority !== ROOT_AUTHORITY) {
    const parent = _delegationStore.get(current.authority);
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }

  console.log('[settleDelegationChain] chain length:', chain.length, '(leaf first)');
  chain.forEach((d, i) => {
    console.log(`  [${i}] delegator=${d.delegator} delegate=${d.delegate} authority=${d.authority.slice(0, 10)}...`);
  });

  const encoded = encodeDelegations(chain as unknown as Parameters<typeof encodeDelegations>[0]);

  // Build execution — transfer 1 USDC raw unit (0.000001 USDC) as proof of delegation
  const leafDelegate = sdkDeleg.delegate as `0x${string}`;
  const transferData = encodeFunctionData({
    abi: [
      {
        name: 'transfer',
        type: 'function',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
    ],
    functionName: 'transfer',
    args: [leafDelegate, BigInt(1)],
  });

  // Construct ExecutionStruct inline (createExecution is internal, not re-exported from utils)
  const executionCalldata = encodeExecutionCalldata([{
    target: USDC_ADDRESS as `0x${string}`,
    value: BigInt(0),
    callData: transferData,
  }]);

  console.log('[settleDelegationChain] executionCalldata:', executionCalldata.slice(0, 40), '...');

  // Build the full redeemDelegations calldata
  const env = getSmartAccountsEnvironment(CHAIN_ID);
  const dmAddr = env.DelegationManager as `0x${string}`;

  const redeemCalldata = encodeFunctionData({
    abi: DM_ABI,
    functionName: 'redeemDelegations',
    args: [
      [encoded],  // bytes[] _permissionContexts
      ['0x0000000000000000000000000000000000000000000000000000000000000000'],  // bytes32[] _modes (SingleDefault)
      [executionCalldata],  // bytes[] _executionCallDatas
    ],
  });

  // Send directly from the leaf delegate EOA
  // The leaf delegate must be msg.sender for DelegationManager validation
  const userKey = process.env.PRIVATE_KEY_USER as `0x${string}`;
  const userEoa = privateKeyToAccount(userKey);

  console.log('[settleDelegationChain] Sending redeemDelegations from:', userEoa.address);
  console.log('[settleDelegationChain] DelegationManager:', dmAddr);

  const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

  // Simulate first to catch errors early
  try {
    await publicClient.call({
      account: userEoa.address,
      to: dmAddr,
      data: redeemCalldata,
    });
    console.log('[settleDelegationChain] Simulation succeeded ✅');
  } catch (simErr: unknown) {
    const msg = simErr instanceof Error ? simErr.message : String(simErr);
    console.error('[settleDelegationChain] Simulation FAILED:', msg);
    throw new Error(`redeemDelegations simulation failed: ${msg}`);
  }

  // Send the real transaction
  const walletClient = createWalletClient({
    account: userEoa,
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const txHash = await walletClient.sendTransaction({
    to: dmAddr,
    data: redeemCalldata,
  });

  console.log('[settleDelegationChain] TX submitted:', txHash);

  // Wait for receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log('[settleDelegationChain] Status:', receipt.status === 'success' ? '✅ SUCCESS' : '❌ REVERTED');
  console.log('[settleDelegationChain] Gas used:', receipt.gasUsed.toString());

  return txHash;
}

/**
 * Create an EIP-7702 authorization for upgrading an EOA to a smart account.
 * Uses toMetaMaskSmartAccount(Implementation.Stateless7702) — no contract deployment,
 * the EOA's code pointer is set to EIP7702StatelessDeleGatorImpl via a 7702 auth tuple.
 * The authorization is included in the 1Shot relay call so execution happens on-chain.
 *
 * Demo: returns a deterministic mock authorization.
 * Live: signs a real authorization tuple with the role's private key.
 */
export async function createEip7702Authorization(role: string): Promise<Eip7702Authorization> {
  if (IS_DEMO) {
    return {
      contractAddress: '0x0000000000000000000000000000000000000001' as `0x${string}`,
      chainId: CHAIN_ID,
      nonce: 0,
      r: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
      s: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
      yParity: 0,
    };
  }

  const { toMetaMaskSmartAccount, Implementation, getSmartAccountsEnvironment } = await import(
    '@metamask/smart-accounts-kit'
  );
  const { privateKeyToAccount, signAuthorization } = await import('viem/accounts');
  const { createPublicClient, http } = await import('viem');

  const privateKey = getPrivateKey(role);
  const account = privateKeyToAccount(privateKey);
  const env = getSmartAccountsEnvironment(CHAIN_ID);
  const contractAddress = env.implementations.EIP7702StatelessDeleGatorImpl as `0x${string}`;

  // toMetaMaskSmartAccount with Stateless7702 — no deployment, EOA IS the smart account
  const client = createPublicClient({
    chain: { id: CHAIN_ID } as Parameters<typeof createPublicClient>[0]['chain'],
    transport: http(RPC_URL),
  });
  await toMetaMaskSmartAccount({
    client,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { account },
  });

  // Sign the EIP-7702 authorization tuple for inclusion in the 1Shot relay transaction
  const signed = await signAuthorization({
    privateKey,
    contractAddress,
    chainId: CHAIN_ID,
    nonce: 0,
  });

  return {
    contractAddress,
    chainId: signed.chainId,
    nonce: signed.nonce,
    r: signed.r,
    s: signed.s,
    yParity: signed.yParity ?? 0,
  };
}

// Re-export for convenience
export { toUsdcRaw, ROOT_BUDGET_USDC, ROOT_MAX_CALLS };
