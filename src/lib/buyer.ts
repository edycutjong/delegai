/* ─────────────────────────────────────────────────────────
 * DelegAI — x402 Buyer Flow
 * Autonomous payment construction for worker agents
 * ───────────────────────────────────────────────────────── */

import type { PremiumDataResponse } from './types';
import { IS_DEMO } from './constants';
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

  // Step 1: Initial request (expect 402)
  const url = `/api/premium-data/${endpoint}`;
  const initialResponse = await fetch(url);

  if (initialResponse.status !== 402) {
    throw new Error(`Expected 402, got ${initialResponse.status}`);
  }

  // Step 2: Parse payment requirements
  const paymentRequired = initialResponse.headers.get('PAYMENT-REQUIRED');
  if (!paymentRequired) {
    throw new Error('Missing PAYMENT-REQUIRED header');
  }

  // Step 3: Create open delegation + encode payment signature
  // const openDelegation = createOpenDelegation({ ... });
  // const encoded = encodeDelegations([openDelegation]);
  const paymentSignature = 'mock-payment-signature'; // TODO: wire up SDK

  // Step 4: Retry with payment
  const paidResponse = await fetch(url, {
    headers: { 'PAYMENT-SIGNATURE': paymentSignature },
  });

  if (!paidResponse.ok) {
    throw new Error(`Payment failed: ${paidResponse.status}`);
  }

  return paidResponse.json();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
