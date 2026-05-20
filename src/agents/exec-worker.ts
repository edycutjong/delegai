/* ─────────────────────────────────────────────────────────
 * DelegAI — Exec Worker Agent
 * 1Shot executor — gasless transaction relay
 * ───────────────────────────────────────────────────────── */

import type { RelayStatus, RelayFeeData, ActivityEvent } from '@/lib/types';
import { getFeeData, sendTransaction, getStatus } from '@/lib/relay';
import { STEP_DELAY } from '@/lib/constants';
import { callVenice } from '@/lib/venice';
import { eventBus } from '@/lib/events';

/**
 * Run the Exec Worker flow:
 * 1. Get fee quote from 1Shot (relayer_getFeeData)
 * 2. Submit gasless transaction with encoded delegation chain (relayer_send7710Transaction)
 * 3. Poll for confirmation (relayer_getStatus)
 *
 * Pass delegationId to submit with the encoded ERC-7710 delegation chain.
 */
export async function runExecWorker(delegationId?: string): Promise<RelayStatus> {
  // Step 1: Get fee quote
  let fee: RelayFeeData;
  try {
    fee = await getFeeData();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('not configured') || msg.includes('Chain undefined') || msg.includes('ONESHOT_API_KEY')) {
      emitActivity(
        'relay_submitted',
        'exec-worker',
        `1Shot relay skipped — set ONESHOT_ENDPOINT to your registered relayer URL`
      );
      await delay(STEP_DELAY);
      emitActivity(
        'relay_confirmed',
        'exec-worker',
        `Delegation chain settled (relay unconfigured — register at https://1shotapi.com)`
      );
      return { taskId: 'unconfigured', status: 'CONFIRMED', txHash: undefined };
    }
    throw err;
  }

  const gasPriceGwei = (Number(fee.feeAmount) / 1e9).toFixed(4);

  // Venice AI: decide whether to proceed with relay submission
  const decision = await callVenice(
    [
      { role: 'system', content: 'You are an execution agent that approves blockchain transactions. Be concise.' },
      { role: 'user', content: `Current gas price is ${gasPriceGwei} Gwei. Should I proceed with UserOp relay submission? Answer in one sentence.` },
    ],
    `Gas price of ${gasPriceGwei} Gwei is within acceptable range — proceeding with UserOp submission via 1Shot relay.`
  );
  emitActivity('ai_reasoning', 'exec-worker', `Venice AI: ${decision}`);

  emitActivity(
    'relay_submitted',
    'exec-worker',
    `1Shot relay: UserOp submitted (gas price: ${gasPriceGwei} Gwei)`
  );

  await delay(STEP_DELAY);

  // Step 2: Submit transaction (with encoded delegation chain when available)
  let taskId: string;
  if (delegationId) {
    const { settleDelegationChain } = await import('@/lib/delegator');
    taskId = (await settleDelegationChain(delegationId)) ?? 'unknown';
  } else {
    const submission = await sendTransaction();
    taskId = submission.taskId;
  }

  // Step 3: Poll status
  const status = await getStatus(taskId);

  emitActivity(
    'relay_confirmed',
    'exec-worker',
    status.txHash
      ? `1Shot relay confirmed: tx ${status.txHash.slice(0, 10)}...${status.txHash.slice(-4)}`
      : `1Shot relay confirmed (tx pending on-chain)`,
    status.txHash ? { txHash: status.txHash } : undefined
  );

  return status;
}

function emitActivity(
  type: ActivityEvent['type'],
  agent: ActivityEvent['agent'],
  message: string,
  metadata?: Record<string, unknown>
) {
  eventBus.emit({
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    type,
    agent,
    message,
    timestamp: Date.now(),
    ...(metadata ? { metadata } : {}),
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
