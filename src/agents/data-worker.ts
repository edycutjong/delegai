/* ─────────────────────────────────────────────────────────
 * DelegAI — Data Worker Agent
 * x402 buyer — fetches premium data via micropayments
 * ───────────────────────────────────────────────────────── */

import type { PremiumDataResponse, ActivityEvent } from '@/lib/types';
import { fetchPremiumData } from '@/lib/buyer';
import { STEP_DELAY, X402_COST_PER_CALL } from '@/lib/constants';
import { eventBus } from '@/lib/events';

/**
 * Run the Data Worker flow:
 * 1. Hit x402-protected market feed endpoint
 * 2. Pay 0.01 USDC via delegation
 * 3. Receive premium data
 */
export async function runDataWorker(): Promise<PremiumDataResponse> {
  // Step 1: Fetch market data via x402
  emitActivity(
    'x402_payment_sent',
    'data-worker',
    `x402 payment: ${X402_COST_PER_CALL} USDC → /api/premium-data/market-feed`
  );

  await delay(STEP_DELAY);

  const data = await fetchPremiumData('market-feed');

  emitActivity(
    'x402_data_received',
    'data-worker',
    `Premium data received: ${Array.isArray(data.assets) ? (data.assets as unknown[]).length : 0} assets`
  );

  return data;
}

function emitActivity(type: ActivityEvent['type'], agent: ActivityEvent['agent'], message: string) {
  eventBus.emit({
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    type,
    agent,
    message,
    timestamp: Date.now(),
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
