'use client';

import { useEffect, useRef, useState } from 'react';
import type { Agent } from '@/lib/types';
import { AGENT_COLORS } from '@/lib/constants';
import { BudgetMeter } from './BudgetMeter';
import { CaveatBadge } from './CaveatBadge';
import { AddressBadge } from './AddressBadge';

interface AgentCardProps {
  agent: Agent;
}

const STATUS_STYLES: Record<string, { dot: string; label: string; ring?: string }> = {
  idle:       { dot: 'bg-text-muted',               label: 'Idle' },
  delegating: { dot: 'bg-info animate-pulse',        label: 'Delegating', ring: 'bg-info' },
  working:    { dot: 'bg-warning animate-pulse',     label: 'Working',    ring: 'bg-warning' },
  settling:   { dot: 'bg-primary animate-pulse',     label: 'Settling',   ring: 'bg-primary' },
  done:       { dot: 'bg-success',                   label: 'Done' },
  error:      { dot: 'bg-danger',                    label: 'Error' },
};

const ROLE_LABELS: Record<string, string> = {
  user:          'User (EOA)',
  master:        'Master Agent',
  'data-worker': 'Data Worker',
  'exec-worker': 'Exec Worker',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  user:          'Root delegator — grants spending authority',
  master:        'Orchestrator — creates sub-delegations',
  'data-worker': 'x402 buyer — pays for premium data',
  'exec-worker': '1Shot executor — gasless transactions',
};

const ROLE_INITIAL: Record<string, string> = {
  user: 'U', master: 'M', 'data-worker': 'D', 'exec-worker': 'E',
};

export function AgentCard({ agent }: AgentCardProps) {
  const statusStyle = STATUS_STYLES[agent.status] || STATUS_STYLES.idle;
  const color = AGENT_COLORS[agent.role] || '#94a3b8';
  const prevStatus = useRef(agent.status);
  const [flashClass, setFlashClass] = useState(() => '');

  useEffect(() => {
    if (prevStatus.current === agent.status) return;
    const prev = prevStatus.current;
    prevStatus.current = agent.status;

    const t = setTimeout(() => {
      if (agent.status === 'working' || agent.status === 'delegating') {
        setFlashClass('animate-card-activate');
      } else if (agent.status === 'done' && prev !== 'idle') {
        setFlashClass('animate-card-done');
      } else {
        setFlashClass('');
      }
    }, 0);
    return () => clearTimeout(t);
  }, [agent.status]);

  const isActive = agent.status === 'working' || agent.status === 'delegating' || agent.status === 'settling';
  const isDone   = agent.status === 'done';

  const shimmer = agent.status === 'working';

  return (
    <div
      className={`glass-card p-4 transition-all duration-300 relative overflow-hidden ${flashClass} ${shimmer ? 'animate-shimmer' : ''}`}
      style={{
        borderColor: isActive
          ? `${color}60`
          : isDone
          ? `${color}30`
          : undefined,
        transition: 'border-color 0.4s ease',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Avatar with optional active ring */}
          <div className="relative shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {ROLE_INITIAL[agent.role] ?? agent.role[0].toUpperCase()}
            </div>
            {isActive && (
              <span
                className="absolute inset-0 rounded-full animate-ping-ring opacity-60"
                style={{ backgroundColor: `${color}40` }}
              />
            )}
            {isDone && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center animate-fade-in-up"
                style={{ backgroundColor: color }}
              >
                <svg viewBox="0 0 8 8" className="w-2 h-2">
                  <polyline points="1,4 3,6.5 7,1.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
          <span className="text-sm font-semibold">{ROLE_LABELS[agent.role]}</span>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5">
          <div className="relative shrink-0 w-2 h-2">
            <span className={`absolute inset-0 rounded-full ${statusStyle.dot}`} />
            {statusStyle.ring && (
              <span className={`absolute inset-0 rounded-full animate-status-ring ${statusStyle.ring} opacity-60`} />
            )}
          </div>
          <span
            key={agent.status}
            className="text-xs text-text-muted font-mono animate-step-flash"
          >
            {statusStyle.label}
          </span>
        </div>
      </div>

      <p className="text-xs text-text-muted mb-3">{ROLE_DESCRIPTIONS[agent.role]}</p>

      {agent.address && (
        <div className="mb-2">
          {agent.role === 'user' ? (
            <AddressBadge address={agent.address} />
          ) : (
            <AddressBadge address={agent.address} minimal className="text-xs text-text-muted" />
          )}
        </div>
      )}

      {agent.budget.allocated > 0 && (
        <BudgetMeter
          allocated={agent.budget.allocated}
          consumed={agent.budget.consumed}
          label={`${agent.budget.callsUsed}/${agent.budget.callsMax} calls`}
        />
      )}

      {agent.delegation && agent.delegation.caveats.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {agent.delegation.caveats.map((c, i) => (
            <CaveatBadge key={i} type={c.type} value={c.value} />
          ))}
        </div>
      )}

    </div>
  );
}
