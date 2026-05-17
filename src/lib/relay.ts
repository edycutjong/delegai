/* ─────────────────────────────────────────────────────────
 * DelegAI — 1Shot Relay Client
 * JSON-RPC client for gasless transaction relay
 * ───────────────────────────────────────────────────────── */

import type { RelayFeeData, RelaySubmission, RelayStatus } from './types';
import { IS_DEMO, ONESHOT_ENDPOINT } from './constants';
import { MOCK_FEE_DATA, MOCK_RELAY_SUBMISSION, MOCK_RELAY_STATUS } from './mock-data';

/**
 * Get fee quote for gasless relay (relayer_getFeeData).
 */
export async function getFeeData(): Promise<RelayFeeData> {
  if (IS_DEMO) {
    await delay(300);
    return { ...MOCK_FEE_DATA, expiresAt: Math.floor(Date.now() / 1000) + 3600 };
  }

  const response = await fetch(ONESHOT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'relayer_getFeeData',
      params: [],
      id: 1,
    }),
  });

  const data = await response.json();
  return data.result as RelayFeeData;
}

/**
 * Submit gasless transaction (relayer_send7710Transaction).
 */
export async function sendTransaction(): Promise<RelaySubmission> {
  /* istanbul ignore next */
  if (IS_DEMO) {
    await delay(800);
    return { ...MOCK_RELAY_SUBMISSION };
  }

  const response = await fetch(ONESHOT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'relayer_send7710Transaction',
      params: [],
      id: 2,
    }),
  });

  const data = await response.json();
  return data.result as RelaySubmission;
}

/**
 * Poll relay status (relayer_getStatus).
 */
export async function getStatus(taskId: string): Promise<RelayStatus> {
  /* istanbul ignore next */
  if (IS_DEMO) {
    await delay(1000);
    return { ...MOCK_RELAY_STATUS, taskId };
  }

  const response = await fetch(ONESHOT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'relayer_getStatus',
      params: [{ taskId }],
      id: 3,
    }),
  });

  const data = await response.json();
  return data.result as RelayStatus;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
