import { NextRequest, NextResponse } from 'next/server';
import { runOrchestration } from '@/agents/orchestrator';
import { runDataWorker } from '@/agents/data-worker';
import { runExecWorker } from '@/agents/exec-worker';
import { eventBus } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
// Pin to same region as /api/events so the in-memory eventBus singleton is shared
export const preferredRegion = 'iad1';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const params = {
    rootBudget:    typeof body.rootBudget    === 'number' ? body.rootBudget    : undefined,
    rootMaxCalls:  typeof body.rootMaxCalls  === 'number' ? body.rootMaxCalls  : undefined,
    workerBudget:  typeof body.workerBudget  === 'number' ? body.workerBudget  : undefined,
    workerMaxCalls: typeof body.workerMaxCalls === 'number' ? body.workerMaxCalls : undefined,
  };

  // Fire-and-forget: client subscribes to /api/events for progress
  (async () => {
    try {
      const chain = await runOrchestration(params);
      await runDataWorker();
      // Exec worker settles the chain via 1Shot relay with encoded delegation
      await runExecWorker(chain.subDelegations[1].id);
      eventBus.emit({
        id: `evt-${Date.now()}-settle`,
        type: 'chain_settled',
        agent: 'master',
        message: 'Delegation chain fully settled on Sepolia',
        timestamp: Date.now(),
      });
    } catch (err) {
      eventBus.emit({
        id: `evt-${Date.now()}-err`,
        type: 'error',
        agent: 'master',
        message: `Orchestration error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      });
    }
  })();

  return NextResponse.json({ started: true });
}
