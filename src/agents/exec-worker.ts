/* ─────────────────────────────────────────────────────────
 * DelegAI — Exec Worker Agent
 * 1Shot executor — gasless transaction relay
 * ───────────────────────────────────────────────────────── */

import type { RelayStatus, ActivityEvent } from '@/lib/types';
import { getFeeData, sendTransaction, getStatus } from '@/lib/relay';
import { STEP_DELAY } from '@/lib/constants';
import { eventBus } from '@/lib/events';

/**
 * Run the Exec Worker flow:
 * 1. Get fee quote from 1Shot (relayer_getFeeData)
 * 2. Submit gasless transaction (relayer_send7710Transaction)
 * 3. Poll for confirmation (relayer_getStatus)
 */
export async function runExecWorker(): Promise<RelayStatus> {
  // Step 1: Get fee quote
  const fee = await getFeeData();
  const feeUsdc = Number(fee.feeAmount) / 1e6;

  emitActivity(
    'relay_submitted',
    'exec-worker',
    `1Shot relay: UserOp submitted (gas: ${feeUsdc.toFixed(4)} USDC)`
  );

  await delay(STEP_DELAY);

  // Step 2: Submit transaction
  const submission = await sendTransaction();

  // Step 3: Poll status
  const status = await getStatus(submission.taskId);

  emitActivity(
    'relay_confirmed',
    'exec-worker',
    `1Shot relay confirmed: tx ${status.txHash?.slice(0, 10)}...${status.txHash?.slice(-4)}`
  );

  return status;
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
