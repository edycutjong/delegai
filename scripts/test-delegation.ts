/**
 * DelegAI — End-to-end delegation chain test
 * Runs the full live flow: orchestrate → settle → poll status
 *
 * Usage: npx tsx --env-file=.env.local scripts/test-delegation.ts
 */

import { requestPermissions, createDelegationWithCaveats, settleDelegationChain } from '../src/lib/delegator';
import { getFeeData, sendTransaction, getStatus } from '../src/lib/relay';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const RPC_URL = process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com';

const toUsdcRaw = (usdc: number) => String(usdc * 1_000_000);
const WORKER_BUDGET_USDC = 10;
const WORKER_MAX_CALLS = 3;

async function main() {
  console.log('\n=== DelegAI End-to-End Delegation Test ===\n');

  // 1. Check on-chain state
  const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
  const USDC_ADDRESS = (process.env.USDC_ADDRESS ?? '0xf8B331F61902c36a506A4CcF700C6877d55a376A') as `0x${string}`;
  const ONESHOT_WALLET = (process.env.ONESHOT_WALLET_ADDRESS ?? '') as `0x${string}`;

  const oneshotEth = await publicClient.getBalance({ address: ONESHOT_WALLET });
  console.log(`1Shot wallet ETH: ${Number(oneshotEth) / 1e18} ETH`);

  const { privateKeyToAccount } = await import('viem/accounts');
  const { getSmartAccountsEnvironment, contracts } = await import('@metamask/smart-accounts-kit');
  const { getContractAddress, pad } = await import('viem');

  const userKey = process.env.PRIVATE_KEY_USER as `0x${string}`;
  const masterKey = process.env.PRIVATE_KEY_MASTER as `0x${string}`;
  const eoaAddr = privateKeyToAccount(userKey).address;
  const masterAddr = privateKeyToAccount(masterKey).address;

  const env = getSmartAccountsEnvironment(11155111);
  const initcode = contracts.HybridDeleGator.encode.initializeHybridDeleGator({ eoaOwner: eoaAddr, p256Owners: [] });
  const proxyCreationCode = contracts.encodeProxyCreationCode({
    implementationAddress: env.implementations.HybridDeleGatorImpl as `0x${string}`,
    initcode,
  });
  const salt = pad('0x0', { dir: 'left', size: 32 });
  const userSmartAccount = getContractAddress({
    bytecode: proxyCreationCode,
    from: env.SimpleFactory as `0x${string}`,
    opcode: 'CREATE2',
    salt,
  });

  console.log(`User HybridDeleGator: ${userSmartAccount}`);
  const code = await publicClient.getCode({ address: userSmartAccount });
  console.log(`Deployed: ${code && code !== '0x' ? 'YES ✓' : 'NO ✗'}`);

  const usdcBalance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }],
    functionName: 'balanceOf',
    args: [userSmartAccount],
  }) as bigint;
  console.log(`USDC balance: ${Number(usdcBalance) / 1e6} USDC\n`);

  // 2. Create delegation chain
  console.log('Step 1: Creating root delegation (user → master)...');
  const rootDelegation = await requestPermissions();
  console.log(`  Root delegation ID: ${rootDelegation.id.slice(0, 16)}...`);
  console.log(`  Delegator: ${rootDelegation.delegator}`);
  console.log(`  Delegate:  ${rootDelegation.delegate}`);

  console.log('\nStep 2: Creating exec sub-delegation (master → 1Shot wallet)...');
  const execDelegation = await createDelegationWithCaveats({
    delegator: masterAddr,
    delegate: ONESHOT_WALLET,
    caveats: [
      { type: 'Erc20TransferAmount', value: toUsdcRaw(WORKER_BUDGET_USDC) },
      { type: 'LimitedCalls', value: WORKER_MAX_CALLS },
    ],
    parentDelegation: rootDelegation.id,
    signerRole: 'master',
  });
  console.log(`  Exec delegation ID: ${execDelegation.id.slice(0, 16)}...`);
  console.log(`  Delegator: ${execDelegation.delegator}`);
  console.log(`  Delegate:  ${execDelegation.delegate}`);

  // 3. Get fee quote
  console.log('\nStep 3: Getting 1Shot fee quote...');
  const fee = await getFeeData();
  const gasPriceGwei = (Number(fee.feeAmount) / 1e9).toFixed(4);
  console.log(`  Gas price: ${gasPriceGwei} Gwei`);

  // 4. Settle via 1Shot
  console.log('\nStep 4: Settling delegation chain via 1Shot relay...');
  const taskId = await settleDelegationChain(execDelegation.id);
  console.log(`  Task ID: ${taskId}`);

  if (!taskId || taskId === 'unknown') {
    console.error('  ✗ No task ID returned — check ONESHOT_CONTRACT_METHOD_ID');
    process.exit(1);
  }

  // 5. Poll for confirmation
  console.log('\nStep 5: Polling for transaction confirmation...');
  let attempts = 0;
  let finalStatus;
  while (attempts < 30) {
    finalStatus = await getStatus(taskId);
    console.log(`  [${++attempts}] Status: ${finalStatus.status}${finalStatus.txHash ? ` | TX: ${finalStatus.txHash}` : ''}`);

    if (finalStatus.status === 'CONFIRMED') {
      console.log('\n✓ Transaction CONFIRMED on Sepolia!');
      if (finalStatus.txHash) {
        console.log(`  Etherscan: https://sepolia.etherscan.io/tx/${finalStatus.txHash}`);
      }
      break;
    }
    if (finalStatus.status === 'FAILED') {
      console.error('\n✗ Transaction FAILED');
      break;
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  if (finalStatus?.status === 'PENDING') {
    console.log(`\n⏳ Still PENDING after ${attempts * 3}s — check 1Shot dashboard`);
    console.log(`  Task: ${taskId}`);
  }

  // 6. Check final USDC balance
  const finalBalance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }],
    functionName: 'balanceOf',
    args: [userSmartAccount],
  }) as bigint;
  console.log(`\nFinal USDC balance: ${Number(finalBalance) / 1e6} USDC (was ${Number(usdcBalance) / 1e6})`);
  if (finalBalance < usdcBalance) {
    console.log(`✓ USDC transferred: ${Number(usdcBalance - finalBalance) / 1e6} USDC moved via delegation chain!`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
