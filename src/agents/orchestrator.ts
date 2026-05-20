/* ─────────────────────────────────────────────────────────
 * DelegAI — Master Agent (Orchestrator)
 * Creates delegation chain and dispatches work to agents
 * ───────────────────────────────────────────────────────── */

import type { DelegationChain, ActivityEvent } from '@/lib/types';
import {
  createDelegationWithCaveats,
  requestPermissions,
  createSmartAccount,
  createEip7702Authorization,
} from '@/lib/delegator';
import {
  IS_DEMO,
  DEMO_ADDRESSES,
  WORKER_BUDGET_USDC,
  WORKER_MAX_CALLS,
  STEP_DELAY,
  toUsdcRaw,
} from '@/lib/constants';
import { callVenice } from '@/lib/venice';
import { eventBus } from '@/lib/events';

/**
 * Run the full orchestration flow:
 * 1. Request root permission from user
 * 2. Create sub-delegations for workers
 * 3. Return complete delegation chain
 */
export async function runOrchestration(): Promise<DelegationChain> {
  // Resolve agent addresses (real in live mode, demo constants in demo mode)
  const masterAddr = IS_DEMO
    ? DEMO_ADDRESSES.master
    : await createSmartAccount('master');
  const dataWorkerAddr = IS_DEMO
    ? DEMO_ADDRESSES.dataWorker
    : await createSmartAccount('data-worker');
  const execWorkerAddr = IS_DEMO
    ? DEMO_ADDRESSES.execWorker
    : await createSmartAccount('exec-worker');

  // In live mode, the exec delegation must be issued to the 1Shot wallet address
  // so that 1Shot's msg.sender is authorized to call redeemDelegations.
  const execDelegateAddr = (!IS_DEMO && process.env.ONESHOT_WALLET_ADDRESS)
    ? process.env.ONESHOT_WALLET_ADDRESS
    : execWorkerAddr;

  // Step 1: Request root permission
  emitActivity('delegation_created', 'user', 'Root delegation created: 50 USDC, 5 calls max');
  await delay(STEP_DELAY);

  const rootDelegation = await requestPermissions();
  emitActivity('delegation_signed', 'user', 'Delegation signed via MetaMask Advanced Permissions');
  await delay(STEP_DELAY);

  // Venice AI: reason about budget allocation before creating sub-delegations
  const budgetReasoning = await callVenice(
    [
      { role: 'system', content: 'You are a master orchestration agent managing a delegation budget for AI workers. Be concise.' },
      { role: 'user', content: `Allocate a 50 USDC budget: data-worker needs market data (10 USDC, 2 calls max), exec-worker handles gasless relay (10 USDC, 2 calls max). Confirm allocation in one sentence.` },
    ],
    'Allocating 10 USDC to Data Worker for market analysis and 10 USDC to Exec Worker for gasless relay — caveat-enforced limits prevent overspend.'
  );
  emitActivity('ai_reasoning', 'master', `Venice AI: ${budgetReasoning}`);
  await delay(STEP_DELAY);

  // Step 2: Create sub-delegation for Data Worker
  const dataDelegation = await createDelegationWithCaveats({
    delegator: masterAddr,
    delegate: dataWorkerAddr,
    caveats: [
      { type: 'Erc20TransferAmount', value: toUsdcRaw(WORKER_BUDGET_USDC) },
      { type: 'LimitedCalls', value: WORKER_MAX_CALLS },
      { type: 'Redeemer', value: dataWorkerAddr },
    ],
    parentDelegation: rootDelegation.id,
    signerRole: 'master',
  });
  emitActivity(
    'sub_delegation_created',
    'master',
    `Sub-delegation → Data Worker: ${WORKER_BUDGET_USDC} USDC, ${WORKER_MAX_CALLS} calls`
  );
  await delay(STEP_DELAY);

  // Step 3: Create sub-delegation for Exec Worker
  const execDelegation = await createDelegationWithCaveats({
    delegator: masterAddr,
    delegate: execDelegateAddr,
    caveats: [
      { type: 'Erc20TransferAmount', value: toUsdcRaw(WORKER_BUDGET_USDC) },
      { type: 'LimitedCalls', value: WORKER_MAX_CALLS },
    ],
    parentDelegation: rootDelegation.id,
    signerRole: 'master',
  });
  emitActivity(
    'sub_delegation_created',
    'master',
    `Sub-delegation → Exec Worker: ${WORKER_BUDGET_USDC} USDC, ${WORKER_MAX_CALLS} calls`
  );
  await delay(STEP_DELAY);

  // EIP-7702: upgrade Exec Worker EOA → smart account via toMetaMaskSmartAccount(Stateless7702)
  const auth = await createEip7702Authorization('exec-worker');
  emitActivity(
    'delegation_created',
    'master',
    `EIP-7702 auth signed: Exec Worker EOA → StatelessDeleGator (${auth.contractAddress.slice(0, 10)}...)`
  );
  await delay(STEP_DELAY);

  return {
    root: rootDelegation,
    subDelegations: [dataDelegation, execDelegation],
  };
}

function emitActivity(
  type: ActivityEvent['type'],
  agent: ActivityEvent['agent'],
  message: string
) {
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
