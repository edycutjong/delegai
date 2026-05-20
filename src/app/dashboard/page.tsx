'use client';

import { useState, useCallback, useRef } from 'react';
import type { Agent, DelegationChain, ActivityEvent, DemoStep } from '@/lib/types';
import { createMockAgents, createMockActivities } from '@/lib/mock-data';
import { Header } from '@/components/Header';
import { DelegationTree } from '@/components/DelegationTree';
import { AgentCard } from '@/components/AgentCard';
import { BudgetMeter } from '@/components/BudgetMeter';
import { ActivityFeed } from '@/components/ActivityFeed';
import { StartDelegationButton } from '@/components/StartDelegationButton';
import {
  ROOT_BUDGET_USDC,
  WORKER_BUDGET_USDC,
  X402_COST_PER_CALL,
} from '@/lib/constants';

const IS_LIVE = process.env.NEXT_PUBLIC_DELEGAI_DEMO !== 'true';

const STEP_LABELS: Record<DemoStep, string> = {
  idle: 'Ready',
  granting_permission: 'Granting Permission…',
  creating_root_delegation: 'Creating Root Delegation…',
  redelegating_data_worker: 'Redelegating → Data Worker…',
  redelegating_exec_worker: 'Redelegating → Exec Worker…',
  x402_payment: 'x402 Payment…',
  x402_data_received: 'Data Received',
  relay_submitting: 'Submitting to 1Shot Relay…',
  relay_confirmed: 'Relay Confirmed',
  settling: 'Settling Chain…',
  complete: 'Chain Settled',
};

const EVENT_TO_STEP: Partial<Record<ActivityEvent['type'], DemoStep>> = {
  delegation_created: 'creating_root_delegation',
  delegation_signed: 'creating_root_delegation',
  sub_delegation_created: 'redelegating_data_worker',
  x402_payment_sent: 'x402_payment',
  x402_data_received: 'x402_data_received',
  relay_submitted: 'relay_submitting',
  relay_confirmed: 'relay_confirmed',
  chain_settled: 'complete',
};

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>(() => createMockAgents());
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [step, setStep] = useState<DemoStep>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [chain, setChain] = useState<DelegationChain | null>(null);
  const subDelegCount = useRef(0);

  const runLive = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActivities([]);
    subDelegCount.current = 0;

    setStep('granting_permission');

    // Open SSE FIRST and wait for server's "connected" ack before triggering the
    // orchestration — otherwise the first synchronously-emitted event is dropped.
    const es = new EventSource('/api/events');
    await new Promise<void>((resolve) => {
      const onConnect = (e: MessageEvent) => {
        const data = JSON.parse(e.data as string) as { type: string };
        if (data.type === 'connected') {
          es.removeEventListener('message', onConnect);
          resolve();
        }
      };
      es.addEventListener('message', onConnect);
    });

    await fetch('/api/delegate', { method: 'POST' });

    es.onmessage = (e: MessageEvent) => {
      const event: ActivityEvent = JSON.parse(e.data as string);
      if ((event.type as string) === 'connected') return;

      setActivities((prev) => [...prev, event]);

      // Map sub_delegation_created to alternating steps
      if (event.type === 'sub_delegation_created') {
        subDelegCount.current += 1;
        const isFirst = subDelegCount.current === 1;
        setStep(isFirst ? 'redelegating_data_worker' : 'redelegating_exec_worker');
        const workerRole = isFirst ? 'data-worker' : 'exec-worker';
        setAgents((prev) =>
          prev.map((a) =>
            a.role === workerRole
              ? { ...a, status: 'idle' as const, budget: { ...a.budget, allocated: WORKER_BUDGET_USDC, callsMax: 2 } }
              : a
          )
        );
      } else {
        const nextStep = EVENT_TO_STEP[event.type];
        if (nextStep) setStep(nextStep);
      }

      // Update agent statuses based on event
      if (event.type === 'delegation_signed') {
        setAgents((prev) =>
          prev.map((a) => (a.role === 'user' ? { ...a, status: 'done' as const } : a))
        );
      } else if (event.type === 'x402_payment_sent') {
        setAgents((prev) =>
          prev.map((a) =>
            a.role === 'data-worker' ? { ...a, status: 'working' as const } : a
          )
        );
      } else if (event.type === 'x402_data_received') {
        setAgents((prev) =>
          prev.map((a) =>
            a.role === 'data-worker'
              ? {
                  ...a,
                  status: 'done' as const,
                  budget: { ...a.budget, consumed: X402_COST_PER_CALL, callsUsed: 1 },
                }
              : a
          )
        );
      } else if (event.type === 'relay_submitted') {
        setAgents((prev) =>
          prev.map((a) =>
            a.role === 'exec-worker' ? { ...a, status: 'working' as const } : a
          )
        );
      } else if (event.type === 'relay_confirmed') {
        setAgents((prev) =>
          prev.map((a) =>
            a.role === 'exec-worker'
              ? {
                  ...a,
                  status: 'done' as const,
                  budget: { ...a.budget, consumed: 0.03, callsUsed: 1 },
                }
              : a
          )
        );
      } else if (event.type === 'chain_settled') {
        setAgents((prev) =>
          prev.map((a) => ({ ...a, status: 'done' as const }))
        );
        // Populate chain so DelegationTree shows the "Chain Settled" block
        setChain({
          root: { id: 'live-root', delegator: '0x', delegate: '0x', caveats: [], salt: '0x0', status: 'settled', createdAt: Date.now() },
          subDelegations: [
            { id: 'live-data', delegator: '0x', delegate: '0x', caveats: [], salt: '0x0', status: 'settled', createdAt: Date.now() },
            { id: 'live-exec', delegator: '0x', delegate: '0x', caveats: [], salt: '0x0', status: 'settled', createdAt: Date.now() },
          ],
        });
        setIsRunning(false);
        es.close();
      } else if (event.type === 'error') {
        setIsRunning(false);
        es.close();
      }
    };

    es.onerror = () => {
      setIsRunning(false);
      es.close();
    };
  }, [isRunning]);

  const runDemo = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActivities([]);

    const allActivities = createMockActivities();
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Step 1: Grant permission
    setStep('granting_permission');
    await delay(800);

    setStep('creating_root_delegation');
    setActivities((prev) => [...prev, allActivities[0]]);
    await delay(1000);

    setActivities((prev) => [...prev, allActivities[1]]);
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'user' ? { ...a, status: 'done' as const } : a
      )
    );
    await delay(800);

    // Step 2: Redelegate
    setStep('redelegating_data_worker');
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'master' ? { ...a, status: 'delegating' as const } : a
      )
    );
    setActivities((prev) => [...prev, allActivities[2]]);
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'data-worker'
          ? {
              ...a,
              status: 'idle' as const,
              budget: {
                ...a.budget,
                allocated: WORKER_BUDGET_USDC,
                callsMax: 2,
              },
            }
          : a
      )
    );
    await delay(800);

    setStep('redelegating_exec_worker');
    setActivities((prev) => [...prev, allActivities[3]]);
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'exec-worker'
          ? {
              ...a,
              status: 'idle' as const,
              budget: {
                ...a.budget,
                allocated: WORKER_BUDGET_USDC,
                callsMax: 2,
              },
            }
          : a
      )
    );
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'master' ? { ...a, status: 'done' as const } : a
      )
    );
    await delay(800);

    // Step 3: x402 payment
    setStep('x402_payment');
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'data-worker'
          ? { ...a, status: 'working' as const }
          : a
      )
    );
    setActivities((prev) => [...prev, allActivities[4]]);
    await delay(1000);

    setStep('x402_data_received');
    setActivities((prev) => [...prev, allActivities[5]]);
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'data-worker'
          ? {
              ...a,
              status: 'done' as const,
              budget: {
                ...a.budget,
                consumed: X402_COST_PER_CALL,
                callsUsed: 1,
              },
            }
          : a
      )
    );
    await delay(800);

    // Step 4: 1Shot relay
    setStep('relay_submitting');
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'exec-worker'
          ? { ...a, status: 'working' as const }
          : a
      )
    );
    setActivities((prev) => [...prev, allActivities[6]]);
    await delay(1200);

    setStep('relay_confirmed');
    setActivities((prev) => [...prev, allActivities[7]]);
    setAgents((prev) =>
      prev.map((a) =>
        a.role === 'exec-worker'
          ? {
              ...a,
              status: 'done' as const,
              budget: {
                ...a.budget,
                consumed: 0.03,
                callsUsed: 1,
              },
            }
          : a
      )
    );
    await delay(800);

    // Step 5: Settle
    setStep('settling');
    setActivities((prev) => [...prev, allActivities[8]]);
    await delay(1000);

    setStep('complete');
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'done' as const,
      }))
    );

    // Build chain for visualization
    const { createMockDelegationChain } = await import('@/lib/mock-data');
    const mockChain = createMockDelegationChain();
    mockChain.root.status = 'settled';
    mockChain.subDelegations.forEach((d) => (d.status = 'settled'));
    setChain(mockChain);

    setIsRunning(false);
  }, [isRunning]);

  const totalConsumed = agents.reduce((sum, a) => sum + a.budget.consumed, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header stepLabel={STEP_LABELS[step]} />

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Status Bar */}
        <div className="glass-card-glow p-4 mb-6 flex items-center justify-between flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3">
            {/* Layered status indicator */}
            <div className="relative w-3 h-3 shrink-0">
              <span
                className={`absolute inset-0 rounded-full ${
                  isRunning ? 'bg-warning' : step === 'complete' ? 'bg-success' : 'bg-text-muted'
                }`}
              />
              {isRunning && (
                <span className="absolute inset-0 rounded-full bg-warning animate-status-ring" />
              )}
              {step === 'complete' && (
                <span className="absolute inset-0 rounded-full bg-success animate-status-ring" />
              )}
            </div>
            <span key={step} className="text-sm font-mono text-text-secondary animate-step-flash">
              {STEP_LABELS[step]}
            </span>
            {isRunning && (
              <span className="hidden sm:inline text-xs font-mono text-text-muted animate-fade-in-up px-2 py-0.5 rounded bg-bg-elevated/50">
                LIVE
              </span>
            )}
          </div>
          <StartDelegationButton
            onClick={IS_LIVE ? runLive : runDemo}
            isRunning={isRunning}
            isComplete={step === 'complete'}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Agents + Budget */}
          <div className="lg:col-span-1 space-y-4">
            <h2
              className="text-sm font-mono text-text-muted uppercase tracking-wider mb-2 animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              Agent Fleet
            </h2>
            {agents.map((agent, i) => (
              <div
                key={agent.id}
                className="animate-slide-in-left"
                style={{ animationDelay: `${120 + i * 80}ms` }}
              >
                <AgentCard agent={agent} />
              </div>
            ))}

            {/* Overall Budget */}
            <div
              className="glass-card p-4 mt-4 animate-fade-in-up"
              style={{ animationDelay: '480ms' }}
            >
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
                Total Budget Consumption
              </h3>
              <BudgetMeter
                allocated={ROOT_BUDGET_USDC}
                consumed={totalConsumed}
                label="Root Delegation"
              />
            </div>
          </div>

          {/* Center Column: Delegation Tree */}
          <div
            className="lg:col-span-1 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-2">
              Delegation Chain
            </h2>
            <DelegationTree agents={agents} chain={chain} step={step} />
          </div>

          {/* Right Column: Activity Feed */}
          <div
            className="lg:col-span-1 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-2">
              Activity Feed
            </h2>
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>
    </div>
  );
}
