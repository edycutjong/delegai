import { NextRequest, NextResponse } from 'next/server';
import { eventBus } from '@/lib/events';

export const dynamic = 'force-dynamic';
// Pin to same region as /api/events so the in-memory eventBus singleton is shared
export const preferredRegion = 'iad1';

interface OneShotWebhookPayload {
  id?: string;
  status?: string;
  transactionHash?: string;
  error?: string;
}

/**
 * POST /api/relay/webhook
 * Receives push status updates from 1Shot relay when a transaction is confirmed or fails.
 * Register this URL as callbackUrl in sendTransaction to avoid polling.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: OneShotWebhookPayload;
  try {
    payload = (await req.json()) as OneShotWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const taskId = payload.id ?? 'unknown';
  const rawStatus = payload.status ?? '';

  const statusMap: Record<string, 'CONFIRMED' | 'FAILED'> = {
    Completed: 'CONFIRMED',
    Failed: 'FAILED',
  };
  const status = statusMap[rawStatus];

  if (status === 'CONFIRMED') {
    eventBus.emit({
      id: `evt-webhook-${Date.now()}`,
      type: 'relay_confirmed',
      agent: 'exec-worker',
      message: payload.transactionHash
        ? `1Shot webhook: tx confirmed ${payload.transactionHash.slice(0, 10)}...${payload.transactionHash.slice(-4)}`
        : `1Shot webhook: tx ${taskId} confirmed`,
      timestamp: Date.now(),
      metadata: payload.transactionHash ? { txHash: payload.transactionHash } : undefined,
    });
  } else if (status === 'FAILED') {
    eventBus.emit({
      id: `evt-webhook-${Date.now()}`,
      type: 'error',
      agent: 'exec-worker',
      message: `1Shot webhook: tx ${taskId} failed${payload.error ? ` — ${payload.error}` : ''}`,
      timestamp: Date.now(),
    });
  }

  return NextResponse.json({ received: true, taskId, status: status ?? 'PENDING' });
}
