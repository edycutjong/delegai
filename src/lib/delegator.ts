/* ─────────────────────────────────────────────────────────
 * DelegAI — Delegator Module
 * Smart account creation + delegation chain management
 * ───────────────────────────────────────────────────────── */

import type { Delegation, Caveat } from './types';
import {
  IS_DEMO,
  DEMO_ADDRESSES,
  toUsdcRaw,
  ROOT_BUDGET_USDC,
  ROOT_MAX_CALLS,
  CHAIN_ID,
  USDC_ADDRESS,
  WORKER_BUDGET_USDC,
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
 * Return the Ethereum address for an agent role.
 * Live mode: derives from private key. Demo: returns deterministic placeholder.
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
export async function requestPermissions(): Promise<Delegation> {
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
  const userKey = getPrivateKey('user');
  const masterKey = getPrivateKey('master');
  const userAddr = privateKeyToAccount(userKey).address;
  const masterAddr = privateKeyToAccount(masterKey).address;

  const delegation = createDelegation({
    environment: env,
    from: userAddr,
    to: masterAddr,
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: USDC_ADDRESS,
      maxAmount: BigInt(toUsdcRaw(ROOT_BUDGET_USDC)),
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
  const { hashDelegation } = await import('@metamask/delegation-core');
  const { privateKeyToAccount } = await import('viem/accounts');

  const env = getSmartAccountsEnvironment(CHAIN_ID);
  const signerRole = params.signerRole || 'master';
  const delegatorKey = getPrivateKey(signerRole);
  const delegatorAddr = privateKeyToAccount(delegatorKey).address as `0x${string}`;
  const delegateAddr = params.delegate as `0x${string}`;

  const parentSdk = params.parentDelegation ? _delegationStore.get(params.parentDelegation) : undefined;

  // Map local Caveat[] to SDK caveat config objects
  const sdkCaveats = params.caveats.map((c): Record<string, unknown> => {
    if (c.type === 'Erc20TransferAmount') {
      return {
        type: CaveatType.Erc20TransferAmount,
        tokenAddress: USDC_ADDRESS,
        maxAmount: BigInt(c.value as string),
      };
    }
    if (c.type === 'LimitedCalls') {
      return { type: CaveatType.LimitedCalls, limit: Number(c.value) };
    }
    if (c.type === 'Redeemer') {
      return { type: CaveatType.Redeemer, redeemers: [c.value as `0x${string}`] };
    }
    return { type: c.type as never };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createDelegationAny = createDelegation as (opts: any) => SdkDelegation;
  const delegation = parentSdk
    ? createDelegationAny({
        environment: env,
        from: delegatorAddr,
        to: delegateAddr,
        parentDelegation: parentSdk,
        caveats: sdkCaveats,
      })
    : createDelegationAny({
        environment: env,
        from: delegatorAddr,
        to: delegateAddr,
        scope: {
          type: 'erc20TransferAmount',
          tokenAddress: USDC_ADDRESS,
          maxAmount: BigInt(toUsdcRaw(WORKER_BUDGET_USDC)),
        },
        caveats: sdkCaveats,
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
  const { sendTransaction } = await import('./relay');

  const sdkDeleg = _delegationStore.get(delegationId);
  if (!sdkDeleg) {
    const result = await sendTransaction();
    return result.taskId;
  }

  const encoded = encodeDelegations([sdkDeleg] as unknown as Parameters<typeof encodeDelegations>[0]);
  const result = await sendTransaction({ encodedDelegations: encoded });
  return result.taskId;
}

// Re-export for convenience
export { toUsdcRaw, ROOT_BUDGET_USDC, ROOT_MAX_CALLS };
