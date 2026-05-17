/* ─────────────────────────────────────────────────────────
 * DelegAI — Master Agent (Orchestrator)
 * Creates delegation chain and dispatches work to agents
 * ───────────────────────────────────────────────────────── */

import type { Agent, DelegationChain, ActivityEvent } from '@/lib/types';
import { createDelegationWithCaveats, requestPermissions } from '@/lib/delegator';
import {
  DEMO_ADDRESSES,
  WORKER_BUDGET_USDC,
  WORKER_MAX_CALLS,
  STEP_DELAY,
  toUsdcRaw,
} from '@/lib/constants';
import { eventBus } from '@/lib/events';

/**
 * Run the full orchestration flow:
 * 1. Request root permission from user
 * 2. Create sub-delegations for workers
 * 3. Return complete delegation chain
 */
export async function runOrchestration(_agents: Agent[]): Promise<DelegationChain> {
  // Step 1: Request root permission
  emitActivity('delegation_created', 'user', 'Root delegation created: 50 USDC, 5 calls max');
  await delay(STEP_DELAY);

  const rootDelegation = await requestPermissions();
  emitActivity('delegation_signed', 'user', 'Delegation signed via MetaMask Advanced Permissions');
  await delay(STEP_DELAY);

  // Step 2: Create sub-delegation for Data Worker
  const dataDelegation = await createDelegationWithCaveats({
    delegator: DEMO_ADDRESSES.master,
    delegate: DEMO_ADDRESSES.dataWorker,
    caveats: [
      { type: 'Erc20TransferAmount', value: toUsdcRaw(WORKER_BUDGET_USDC) },
      { type: 'LimitedCalls', value: WORKER_MAX_CALLS },
      { type: 'Redeemer', value: DEMO_ADDRESSES.dataWorker },
    ],
    parentDelegation: rootDelegation.id,
  });
  emitActivity('sub_delegation_created', 'master', `Sub-delegation → Data Worker: ${WORKER_BUDGET_USDC} USDC, ${WORKER_MAX_CALLS} calls`);
  await delay(STEP_DELAY);

  // Step 3: Create sub-delegation for Exec Worker
  const execDelegation = await createDelegationWithCaveats({
    delegator: DEMO_ADDRESSES.master,
    delegate: DEMO_ADDRESSES.execWorker,
    caveats: [
      { type: 'Erc20TransferAmount', value: toUsdcRaw(WORKER_BUDGET_USDC) },
      { type: 'LimitedCalls', value: WORKER_MAX_CALLS },
      { type: 'Redeemer', value: DEMO_ADDRESSES.execWorker },
    ],
    parentDelegation: rootDelegation.id,
  });
  emitActivity('sub_delegation_created', 'master', `Sub-delegation → Exec Worker: ${WORKER_BUDGET_USDC} USDC, ${WORKER_MAX_CALLS} calls`);
  await delay(STEP_DELAY);

  return {
    root: rootDelegation,
    subDelegations: [dataDelegation, execDelegation],
  };
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
