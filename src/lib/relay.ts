/* ─────────────────────────────────────────────────────────
 * DelegAI — 1Shot Relay Client
 * REST API client for gasless transaction relay via 1Shot API
 * API: https://api.1shotapi.com/v0 (OAuth2 client credentials)
 * ───────────────────────────────────────────────────────── */

import type { RelayFeeData, RelaySubmission, RelayStatus } from './types';
import { IS_DEMO, CHAIN_ID } from './constants';
import { MOCK_FEE_DATA, MOCK_RELAY_SUBMISSION, MOCK_RELAY_STATUS } from './mock-data';

const ONESHOT_API_BASE = 'https://api.1shotapi.com/v0';

// Module-level token cache — refreshed before expiry
let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const key = process.env.ONESHOT_API_KEY;
  const secret = process.env.ONESHOT_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      '1Shot relay not configured: set ONESHOT_API_KEY and ONESHOT_API_SECRET from https://1shotapi.com'
    );
  }

  const res = await fetch(`${ONESHOT_API_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: key,
      client_secret: secret,
    }).toString(),
  });

  const data = await res.json() as { access_token?: string; message?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error(`1Shot auth failed: ${data.message ?? 'invalid credentials'}`);
  }

  _token = data.access_token;
  _tokenExpiry = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000;
  return _token!;
}

/**
 * Get gas fee estimate from 1Shot (GET /chains/{chainId}/fees).
 * Returns effectiveGasPrice in wei as feeAmount.
 */
export async function getFeeData(): Promise<RelayFeeData> {
  if (IS_DEMO) {
    await delay(300);
    return { ...MOCK_FEE_DATA, expiresAt: Math.floor(Date.now() / 1000) + 3600 };
  }

  const token = await getToken();

  const res = await fetch(`${ONESHOT_API_BASE}/chains/${CHAIN_ID}/fees`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const fees = await res.json() as { effectiveGasPrice?: string; message?: string };
  if (!res.ok) throw new Error(`getFeeData failed: ${fees.message ?? res.status}`);

  return {
    feeToken: 'ETH',
    feeAmount: fees.effectiveGasPrice ?? '0',
    expiresAt: Math.floor(Date.now() / 1000) + 300,
  };
}

/**
 * Submit gasless transaction via 1Shot executeAsDelegator.
 * Requires ONESHOT_CONTRACT_METHOD_ID env var; degrades gracefully without it.
 */
export async function sendTransaction(params?: {
  encodedDelegations?: string;
  executionCalldata?: string;
}): Promise<RelaySubmission> {
  if (IS_DEMO) {
    await delay(800);
    return { ...MOCK_RELAY_SUBMISSION };
  }

  const methodId = process.env.ONESHOT_CONTRACT_METHOD_ID;
  if (!methodId) {
    return { taskId: 'no-method-configured', status: 'PENDING' };
  }

  const token = await getToken();

  // Include webhook callback URL when configured so 1Shot can push status updates
  const body: Record<string, unknown> = {
    params: {
      _permissionContexts: params?.encodedDelegations ? [params.encodedDelegations] : [],
      _modes: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
      // ERC-7579 single-call: encodePacked(address target, uint256 value, bytes data) — min 52 bytes
      _executionCallDatas: [params?.executionCalldata ?? `0x${'00'.repeat(52)}`],
    },
  };
  if (process.env.ONESHOT_WEBHOOK_URL) {
    body.callbackUrl = process.env.ONESHOT_WEBHOOK_URL;
  }

  const res = await fetch(`${ONESHOT_API_BASE}/methods/${methodId}/execute`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const tx = await res.json() as { id?: string; status?: string; message?: string };
  if (!res.ok) throw new Error(`sendTransaction failed: ${tx.message ?? res.status}`);

  return { taskId: tx.id ?? 'unknown', status: 'PENDING' };
}

/**
 * Poll transaction status (GET /transactions/{transactionId}).
 * Returns CONFIRMED immediately for placeholder taskIds.
 */
export async function getStatus(taskId: string): Promise<RelayStatus> {
  if (IS_DEMO) {
    await delay(1000);
    return { ...MOCK_RELAY_STATUS, taskId };
  }

  if (taskId === 'no-method-configured' || taskId === 'unknown' || taskId === 'unconfigured') {
    return { taskId, status: 'CONFIRMED', txHash: undefined };
  }

  const token = await getToken();

  const res = await fetch(`${ONESHOT_API_BASE}/transactions/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const tx = await res.json() as { id?: string; status?: string; transactionHash?: string; message?: string };
  if (!res.ok) throw new Error(`getStatus failed: ${tx.message ?? res.status}`);

  const statusMap: Record<string, 'PENDING' | 'CONFIRMED' | 'FAILED'> = {
    Completed: 'CONFIRMED',
    Failed: 'FAILED',
  };

  return {
    taskId: tx.id ?? taskId,
    status: statusMap[tx.status ?? ''] ?? 'PENDING',
    txHash: tx.transactionHash,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
