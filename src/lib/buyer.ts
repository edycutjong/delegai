/* ─────────────────────────────────────────────────────────
 * DelegAI — x402 Buyer Flow
 * Autonomous payment construction for worker agents
 * ───────────────────────────────────────────────────────── */

import type { PremiumDataResponse } from './types';
import { IS_DEMO, CHAIN_ID, USDC_ADDRESS } from './constants';
import { MOCK_MARKET_FEED, MOCK_DEFI_YIELDS } from './mock-data';

/**
 * Fetch premium data via x402 payment flow.
 *
 * Flow:
 * 1. GET /api/premium-data/{endpoint}
 * 2. Receive 402 PAYMENT-REQUIRED with requirements
 * 3. Create open delegation → encode → PAYMENT-SIGNATURE header
 * 4. Retry request with payment header
 * 5. Receive 200 OK + data
 *
 * In demo mode: skips 402 handshake, returns mock data
 */
export async function fetchPremiumData(
  endpoint: 'market-feed' | 'defi-yields'
): Promise<PremiumDataResponse> {
  if (IS_DEMO) {
    await delay(400);
    return endpoint === 'market-feed'
      ? { ...MOCK_MARKET_FEED }
      : { ...MOCK_DEFI_YIELDS };
  }

  // Falls back to localhost:3000 for local dev; set NEXT_PUBLIC_BASE_URL in production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/premium-data/${endpoint}`;

  // Step 1: Initial request (expect 402)
  const initialResponse = await fetch(url).catch((err: Error) => {
    throw new Error(`x402 fetch to ${url} failed — check NEXT_PUBLIC_BASE_URL. (${err.message})`);
  });

  if (initialResponse.status !== 402) {
    throw new Error(`Expected 402, got ${initialResponse.status}`);
  }

  // Step 2: Parse payment requirements
  const paymentRequired = initialResponse.headers.get('PAYMENT-REQUIRED');
  if (!paymentRequired) {
    throw new Error('Missing PAYMENT-REQUIRED header');
  }

  // Step 3: Build payment signature using an open delegation encoded as ERC-7710 bytes
  const paymentSignature = await buildPaymentSignature();

  // Step 4: Retry with payment
  const paidResponse = await fetch(url, {
    headers: { 'PAYMENT-SIGNATURE': paymentSignature },
  });

  if (!paidResponse.ok) {
    throw new Error(`Payment failed: ${paidResponse.status}`);
  }

  return paidResponse.json();
}

async function buildPaymentSignature(): Promise<string> {
  const { createOpenDelegation, getSmartAccountsEnvironment, ScopeType, signDelegation } =
    await import('@metamask/smart-accounts-kit');
  const { encodeDelegations } = await import('@metamask/delegation-core');
  const { privateKeyToAccount } = await import('viem/accounts');

  const dataWorkerKey = process.env.PRIVATE_KEY_DATA_WORKER as `0x${string}`;
  if (!dataWorkerKey) throw new Error('Missing env PRIVATE_KEY_DATA_WORKER');

  const env = getSmartAccountsEnvironment(CHAIN_ID);
  const dataWorkerAddr = privateKeyToAccount(dataWorkerKey).address;

  // Open delegation: any redeemer can claim (one-time payment authorization)
  const openDeleg = createOpenDelegation({
    environment: env,
    from: dataWorkerAddr,
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: USDC_ADDRESS,
      maxAmount: BigInt('10000'), // 0.01 USDC in raw units
    },
  }) as {
    delegate: `0x${string}`;
    delegator: `0x${string}`;
    authority: `0x${string}`;
    caveats: { enforcer: `0x${string}`; terms: `0x${string}`; args: `0x${string}` }[];
    salt: `0x${string}`;
    signature: `0x${string}`;
  };

  const signature = await signDelegation({
    privateKey: dataWorkerKey,
    delegation: openDeleg,
    delegationManager: env.DelegationManager,
    chainId: CHAIN_ID,
    allowInsecureUnrestrictedDelegation: true,
  });

  const signed = { ...openDeleg, signature };
  return encodeDelegations([signed] as unknown as Parameters<typeof encodeDelegations>[0]);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
