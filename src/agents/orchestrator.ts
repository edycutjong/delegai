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
  ROOT_BUDGET_USDC,
  ROOT_MAX_CALLS,
  WORKER_BUDGET_USDC,
  WORKER_MAX_CALLS,
  STEP_DELAY,
  toUsdcRaw,
} from '@/lib/constants';
import { callVenice } from '@/lib/venice';
import { eventBus } from '@/lib/events';

export interface OrchestrationParams {
  rootBudget?: number;
  rootMaxCalls?: number;
  workerBudget?: number;
  workerMaxCalls?: number;
}

/**
 * Run the full orchestration flow:
 * 1. Request root permission from user
 * 2. Create sub-delegations for workers
 * 3. Return complete delegation chain
 */
export async function runOrchestration(params: OrchestrationParams = {}): Promise<DelegationChain> {
  const rootBudget   = params.rootBudget   ?? ROOT_BUDGET_USDC;
  const rootMaxCalls = params.rootMaxCalls ?? ROOT_MAX_CALLS;
  const workerBudget = params.workerBudget ?? WORKER_BUDGET_USDC;
  const workerMaxCalls = params.workerMaxCalls ?? WORKER_MAX_CALLS;
  // Resolve agent addresses (real in live mode, demo constants in demo mode)
  const userAddr = IS_DEMO
    ? DEMO_ADDRESSES.user
    : await createSmartAccount('user');
  const masterAddr = IS_DEMO
    ? DEMO_ADDRESSES.master
    : await createSmartAccount('master');
  const dataWorkerAddr = IS_DEMO
    ? DEMO_ADDRESSES.dataWorker
    : await createSmartAccount('data-worker');
  const execWorkerAddr = IS_DEMO
    ? DEMO_ADDRESSES.execWorker
    : await createSmartAccount('exec-worker');

  // In live mode, the exec delegation must be issued to the User EOA address
  // so that the User EOA (msg.sender) is authorized to call redeemDelegations directly.
  // Previously this was the 1Shot wallet, but we now bypass the relay.
  let execDelegateAddr = execWorkerAddr;
  if (!IS_DEMO && process.env.PRIVATE_KEY_USER) {
    const { privateKeyToAccount } = await import('viem/accounts');
    execDelegateAddr = privateKeyToAccount(process.env.PRIVATE_KEY_USER as `0x${string}`).address;
  }

  // Broadcast real addresses to the dashboard so agent cards show on-chain addresses
  if (!IS_DEMO) {
    eventBus.emit({
      id: `evt-${Date.now()}-addrs`,
      type: 'addresses_resolved',
      agent: 'master',
      message: 'Agent addresses resolved',
      timestamp: Date.now(),
      metadata: {
        user: userAddr,
        master: masterAddr,
        'data-worker': dataWorkerAddr,
        'exec-worker': execWorkerAddr,
      },
    });
  }

  // Step 1: Request root permission
  emitActivity('delegation_created', 'user', `Root delegation created: ${rootBudget} USDC, ${rootMaxCalls} calls max`);
  await delay(STEP_DELAY);

  const rootDelegation = await requestPermissions(rootBudget, rootMaxCalls);
  emitActivity('delegation_signed', 'user', 'Delegation signed via MetaMask Advanced Permissions', { delegation: rootDelegation });
  await delay(STEP_DELAY);

  // Venice AI: reason about budget allocation before creating sub-delegations
  const budgetReasoning = await callVenice(
    [
      { role: 'system', content: 'You are a master orchestration agent managing a delegation budget for AI workers. Be concise.' },
      { role: 'user', content: `Allocate a ${rootBudget} USDC budget: data-worker needs market data (${workerBudget} USDC, ${workerMaxCalls} calls max), exec-worker handles gasless relay (${workerBudget} USDC, ${workerMaxCalls} calls max). Confirm allocation in one sentence.` },
    ],
    `Allocating ${workerBudget} USDC to Data Worker for market analysis and ${workerBudget} USDC to Exec Worker for gasless relay — caveat-enforced limits prevent overspend.`
  );
  emitActivity('ai_reasoning', 'master', `Venice AI: ${budgetReasoning}`);
  await delay(STEP_DELAY);

  // Step 2: Create sub-delegation for Data Worker
  const dataDelegation = await createDelegationWithCaveats({
    delegator: masterAddr,
    delegate: dataWorkerAddr,
    caveats: [
      { type: 'Erc20TransferAmount', value: toUsdcRaw(workerBudget) },
      { type: 'LimitedCalls', value: workerMaxCalls },
      { type: 'Redeemer', value: dataWorkerAddr },
    ],
    parentDelegation: rootDelegation.id,
    signerRole: 'master',
  });
  emitActivity(
    'sub_delegation_created',
    'master',
    `Sub-delegation → Data Worker: ${workerBudget} USDC, ${workerMaxCalls} calls`,
    { delegation: dataDelegation }
  );
  await delay(STEP_DELAY);

  // Step 3: Create sub-delegation for Exec Worker
  const execDelegation = await createDelegationWithCaveats({
    delegator: masterAddr,
    delegate: execDelegateAddr,
    caveats: [
      { type: 'Erc20TransferAmount', value: toUsdcRaw(workerBudget) },
      { type: 'LimitedCalls', value: workerMaxCalls },
    ],
    parentDelegation: rootDelegation.id,
    signerRole: 'master',
  });
  emitActivity(
    'sub_delegation_created',
    'master',
    `Sub-delegation → Exec Worker: ${workerBudget} USDC, ${workerMaxCalls} calls`,
    { delegation: execDelegation }
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
  message: string,
  metadata?: Record<string, unknown>
) {
  eventBus.emit({
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    type,
    agent,
    message,
    timestamp: Date.now(),
    metadata,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

