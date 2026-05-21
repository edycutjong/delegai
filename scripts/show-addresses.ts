/**
 * DelegAI — Show Agent Addresses
 *
 * Prints all 4 agent addresses derived from private keys,
 * including the computed HybridDeleGator contract address for the User.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/show-addresses.ts
 *
 * The User address is the HybridDeleGator (smart contract) — fund this
 * with USDC on Sepolia before running live delegation.
 */

import { privateKeyToAccount } from 'viem/accounts';
import { getContractAddress, pad } from 'viem';
import { getSmartAccountsEnvironment, contracts } from '@metamask/smart-accounts-kit';

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');

function getKey(name: string): `0x${string}` {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  const key = val.startsWith('0x') ? val : `0x${val}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error(`Invalid ${name}`);
  return key as `0x${string}`;
}

async function main() {
  const env = getSmartAccountsEnvironment(CHAIN_ID);
  const explorer = 'https://sepolia.etherscan.io';

  const roles = ['user', 'master', 'data-worker', 'exec-worker'] as const;
  const keyEnvs: Record<string, string> = {
    user: 'PRIVATE_KEY_USER',
    master: 'PRIVATE_KEY_MASTER',
    'data-worker': 'PRIVATE_KEY_DATA_WORKER',
    'exec-worker': 'PRIVATE_KEY_EXEC_WORKER',
  };

  console.log('\n── DelegAI Agent Addresses ───────────────────────────\n');

  for (const role of roles) {
    const key = getKey(keyEnvs[role]);
    const eoa = privateKeyToAccount(key).address;

    if (role === 'user') {
      const initcode = contracts.HybridDeleGator.encode.initializeHybridDeleGator({
        eoaOwner: eoa,
        p256Owners: [],
      });
      const proxyCode = contracts.encodeProxyCreationCode({
        implementationAddress: env.implementations.HybridDeleGatorImpl as `0x${string}`,
        initcode,
      });
      const salt = pad('0x0', { dir: 'left', size: 32 });
      const contractAddr = getContractAddress({
        bytecode: proxyCode,
        from: env.SimpleFactory as `0x${string}`,
        opcode: 'CREATE2',
        salt,
      });

      console.log(`User EOA          ${eoa}`);
      console.log(`User (Contract)   ${contractAddr}  ← fund this with USDC`);
      console.log(`                  ${explorer}/address/${contractAddr}`);
    } else {
      const label = role === 'master' ? 'Master Agent     ' :
                    role === 'data-worker' ? 'Data Worker      ' : 'Exec Worker      ';
      console.log(`${label} ${eoa}`);
      console.log(`                  ${explorer}/address/${eoa}`);
    }
    console.log();
  }

  console.log('──────────────────────────────────────────────────────\n');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
