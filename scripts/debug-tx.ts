/**
 * Debug 1Shot v0 — fetch full transaction details using correct API
 * Usage: npx tsx --env-file=.env.local scripts/debug-tx.ts [taskId]
 */

const ONESHOT_API_BASE = 'https://api.1shotapi.com/v0';

async function getToken(): Promise<string> {
  const key = process.env.ONESHOT_API_KEY!;
  const secret = process.env.ONESHOT_API_SECRET!;
  const res = await fetch(`${ONESHOT_API_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${key}&client_secret=${secret}`,
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function main() {
  const token = await getToken();
  console.log('Token obtained ✓\n');

  // Latest task ID from our last test run
  const taskId = process.argv[2] || '66c98e42-509c-4645-bf1c-de238b2943fa';
  
  // Fetch transaction details
  console.log(`--- Transaction ${taskId} ---`);
  const txRes = await fetch(`${ONESHOT_API_BASE}/transactions/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`Status: ${txRes.status}`);
  const txData = await txRes.json();
  console.log(JSON.stringify(txData, null, 2));

  // Also fetch the method details
  const methodId = process.env.ONESHOT_CONTRACT_METHOD_ID!;
  console.log(`\n--- Method ${methodId} ---`);
  const methodRes = await fetch(`${ONESHOT_API_BASE}/methods/${methodId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`Status: ${methodRes.status}`);
  const methodData = await methodRes.json();
  console.log(JSON.stringify(methodData, null, 2));

  // Try listing all smart contracts
  console.log('\n--- Smart Contracts ---');
  const contractsRes = await fetch(`${ONESHOT_API_BASE}/smart-contracts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`Status: ${contractsRes.status}`);
  const contracts = await contractsRes.json();
  console.log(JSON.stringify(contracts, null, 2));
}

main().catch(console.error);
