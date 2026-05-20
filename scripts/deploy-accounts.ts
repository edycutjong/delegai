/**
 * DelegAI — Deploy Smart Accounts
 *
 * Deploys the user HybridDeleGator via SimpleFactory on Sepolia.
 * Run once before using live delegation mode.
 *
 * Usage: npx tsx scripts/deploy-accounts.ts
 *
 * Prerequisites:
 *   - PRIVATE_KEY_USER set in .env.local
 *   - User EOA must have Sepolia ETH (~0.01 ETH for deployment gas)
 *   - After deployment, fund the smart account with Sepolia USDC from
 *     https://faucet.circle.com (select Sepolia, paste the smart account address)
 */

import { createPublicClient, createWalletClient, http, pad, getContractAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { getSmartAccountsEnvironment, contracts } from '@metamask/smart-accounts-kit';
import { SimpleFactory as SimpleFactoryAbi } from '@metamask/delegation-abis';

const CHAIN_ID = 11155111;
const RPC_URL = process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com';

function getPrivateKey(envName: string): `0x${string}` {
  const val = process.env[envName];
  if (!val) throw new Error(`Missing env ${envName}`);
  return val as `0x${string}`;
}

async function main() {
  const userKey = getPrivateKey('PRIVATE_KEY_USER');
  const eoaAccount = privateKeyToAccount(userKey);
  const env = getSmartAccountsEnvironment(CHAIN_ID);

  const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account: eoaAccount, chain: sepolia, transport: http(RPC_URL) });

  // Compute counterfactual address
  const initcode = contracts.HybridDeleGator.encode.initializeHybridDeleGator({
    eoaOwner: eoaAccount.address,
    p256Owners: [],
  });
  const proxyCreationCode = contracts.encodeProxyCreationCode({
    implementationAddress: env.implementations.HybridDeleGatorImpl as `0x${string}`,
    initcode,
  });
  const salt = pad('0x0', { dir: 'left', size: 32 });
  const smartAccountAddr = getContractAddress({
    bytecode: proxyCreationCode,
    from: env.SimpleFactory as `0x${string}`,
    opcode: 'CREATE2',
    salt,
  });

  const eoaBalance = await publicClient.getBalance({ address: eoaAccount.address });
  const code = await publicClient.getCode({ address: smartAccountAddr });
  const isDeployed = code !== undefined && code !== '0x';

  // Check USDC balance of smart account
  const USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`;
  let usdcBalance = BigInt(0);
  try {
    usdcBalance = await publicClient.readContract({
      address: USDC,
      abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }],
      functionName: 'balanceOf',
      args: [smartAccountAddr],
    }) as bigint;
  } catch { /* ignore */ }

  console.log('\n=== DelegAI Smart Account Setup ===\n');
  console.log(`Owner EOA:        ${eoaAccount.address}`);
  console.log(`EOA ETH balance:  ${Number(eoaBalance) / 1e18} ETH`);
  console.log(`Smart Account:    ${smartAccountAddr}`);
  console.log(`Deployed:         ${isDeployed}`);
  console.log(`USDC balance:     ${Number(usdcBalance) / 1e6} USDC\n`);

  if (isDeployed) {
    console.log('✓ Smart account already deployed.\n');
    if (usdcBalance === BigInt(0)) {
      console.log('⚠ No USDC on smart account. Get testnet USDC:');
      console.log(`  https://faucet.circle.com → Sepolia → paste: ${smartAccountAddr}\n`);
    }
    return;
  }

  if (eoaBalance < BigInt('5000000000000000')) { // 0.005 ETH minimum
    console.error(`✗ Not enough ETH in EOA. Need ~0.01 ETH, have ${Number(eoaBalance) / 1e18} ETH.`);
    console.error(`  Fund ${eoaAccount.address} from a Sepolia faucet first.\n`);
    process.exit(1);
  }

  console.log('Deploying HybridDeleGator via SimpleFactory...');
  const deployCalldata = contracts.SimpleFactory.encode.create2Deploy(proxyCreationCode, salt);
  const txHash = await walletClient.sendTransaction({
    to: env.SimpleFactory as `0x${string}`,
    data: deployCalldata,
  });
  console.log(`  TX submitted: ${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') {
    console.error('✗ Deployment transaction reverted.');
    process.exit(1);
  }

  console.log(`✓ Deployed at: ${smartAccountAddr}\n`);
  console.log('Next step — fund the smart account with testnet USDC:');
  console.log(`  https://faucet.circle.com → Sepolia → paste: ${smartAccountAddr}`);
  console.log('\nThen add to .env.local:');
  console.log(`  USER_SMART_ACCOUNT=${smartAccountAddr}\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
