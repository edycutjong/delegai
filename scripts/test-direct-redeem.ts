/**
 * DelegAI — Direct redeemDelegations test (bypasses 1Shot relay)
 * Calls redeemDelegations directly from the exec-worker EOA.
 *
 * Usage: npx tsx --env-file=.env.local scripts/test-direct-redeem.ts
 */

import { createPublicClient, createWalletClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { requestPermissions, createDelegationWithCaveats, _getDelegationStore } from '../src/lib/delegator';
import { getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit';
import { encodeDelegations } from '@metamask/delegation-core';
import { encodeExecutionCalldata } from '@metamask/smart-accounts-kit/utils';

const RPC_URL = process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com';
const USDC_ADDRESS = (process.env.USDC_ADDRESS ?? '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') as `0x${string}`;

const toUsdcRaw = (usdc: number) => String(usdc * 1_000_000);

async function main() {
  console.log('\n=== Direct redeemDelegations Test ===\n');

  const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

  // Use USER EOA as the redeemer (only one with ETH)
  // msg.sender must == leaf.delegate for DelegationManager validation
  const userKey = process.env.PRIVATE_KEY_USER as `0x${string}`;
  const userEoa = privateKeyToAccount(userKey);
  console.log(`User EOA (redeemer): ${userEoa.address}`);

  const ethBalance = await publicClient.getBalance({ address: userEoa.address });
  console.log(`ETH balance: ${Number(ethBalance) / 1e18} ETH`);
  if (ethBalance === BigInt(0)) {
    console.error('❌ User EOA has no ETH — cannot send tx. Fund from faucet.');
    process.exit(1);
  }

  // Create delegation chain: user(smart_account) → master → user_eoa (as redeemer)
  console.log('\nStep 1: Root delegation (user_smart_account → master)...');
  const root = await requestPermissions();
  console.log(`  ID: ${root.id.slice(0, 16)}...`);

  const masterKey = process.env.PRIVATE_KEY_MASTER as `0x${string}`;
  const masterAddr = privateKeyToAccount(masterKey).address;

  // Leaf: master → user_eoa (so user_eoa is the delegate/redeemer)
  console.log('Step 2: Sub-delegation (master → user_eoa as redeemer)...');
  const sub = await createDelegationWithCaveats({
    delegator: masterAddr,
    delegate: userEoa.address,
    caveats: [
      { type: 'Erc20TransferAmount', value: toUsdcRaw(10) },
      { type: 'LimitedCalls', value: 3 },
    ],
    parentDelegation: root.id,
    signerRole: 'master',
  });
  console.log(`  ID: ${sub.id.slice(0, 16)}...`);

  // Access internal delegation store
  const store = _getDelegationStore();
  
  // Build delegation chain manually
  const ROOT_AUTHORITY = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  const leafDeleg = store.get(sub.id);
  if (!leafDeleg) {
    console.error('❌ Leaf delegation not found in store');
    process.exit(1);
  }
  
  const chain = [leafDeleg];
  let current = leafDeleg;
  while (current.authority && current.authority !== ROOT_AUTHORITY) {
    const parent = store.get(current.authority);
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  console.log(`\nChain length: ${chain.length} (leaf first)`);

  // Encode
  const encoded = encodeDelegations(chain as any);
  console.log(`Encoded delegations: ${encoded.slice(0, 30)}...`);

  // Build execution — transfer 1 raw USDC unit to the exec worker itself (self-transfer as proof)
  const transferData = encodeFunctionData({
    abi: [{
      name: 'transfer', type: 'function',
      inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
      outputs: [{ name: '', type: 'bool' }],
    }],
    functionName: 'transfer',
    args: [userEoa.address, BigInt(1)],
  });

  const executionCalldata = encodeExecutionCalldata([{
    target: USDC_ADDRESS,
    value: BigInt(0),
    callData: transferData,
  }]);
  console.log(`Execution calldata: ${executionCalldata.slice(0, 30)}...`);

  // Build the full redeemDelegations calldata
  const env = getSmartAccountsEnvironment(11155111);
  const dmAddr = env.DelegationManager as `0x${string}`;
  console.log(`\nDelegationManager: ${dmAddr}`);

  // Import the DelegationManager ABI
  const { DelegationManager: DM_ABI } = await import('@metamask/delegation-abis');

  const redeemCalldata = encodeFunctionData({
    abi: DM_ABI,
    functionName: 'redeemDelegations',
    args: [
      [encoded],  // bytes[] _permissionContexts
      ['0x0000000000000000000000000000000000000000000000000000000000000000'],  // bytes32[] _modes (SingleDefault)
      [executionCalldata],  // bytes[] _executionCallDatas
    ],
  });
  console.log(`redeemDelegations calldata: ${redeemCalldata.slice(0, 30)}... (${redeemCalldata.length / 2 - 1} bytes)`);

  // Simulate first
  console.log('\nStep 3: Simulating redeemDelegations...');
  try {
    await publicClient.call({
      account: userEoa.address,
      to: dmAddr,
      data: redeemCalldata,
    });
    console.log('✅ Simulation succeeded!');
  } catch (simError: any) {
    console.error('❌ Simulation FAILED:', simError.shortMessage ?? simError.message);
    console.error('Details:', JSON.stringify(simError.cause?.data ?? simError.details ?? 'no details', null, 2));
    process.exit(1);
  }

  // Send the actual transaction
  console.log('\nStep 4: Sending real transaction...');
  const walletClient = createWalletClient({
    account: userEoa,
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const txHash = await walletClient.sendTransaction({
    to: dmAddr,
    data: redeemCalldata,
  });
  console.log(`✅ TX submitted: ${txHash}`);
  console.log(`   Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);

  // Wait for receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`\nStatus: ${receipt.status === 'success' ? '✅ SUCCESS' : '❌ REVERTED'}`);
  console.log(`Gas used: ${receipt.gasUsed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
