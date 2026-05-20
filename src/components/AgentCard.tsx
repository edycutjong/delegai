'use client';

import { useEffect, useRef, useState } from 'react';
import type { Agent } from '@/lib/types';
import { AGENT_COLORS } from '@/lib/constants';
import { BudgetMeter } from './BudgetMeter';
import { CaveatBadge } from './CaveatBadge';

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
  const [flashClass, setFlashClass] = useState('');

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
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {ROLE_INITIAL[agent.role] ?? agent.role[0].toUpperCase()}
            </div>
            {isActive && (
              <span
                className="absolute inset-0 rounded-md animate-ping-ring opacity-60"
                style={{ backgroundColor: `${color}40` }}
              />
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

      <div className="text-xs font-mono text-text-muted mb-2 truncate">
        {agent.address.slice(0, 10)}...{agent.address.slice(-4)}
      </div>

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

      {/* Done checkmark overlay */}
      {isDone && (
        <div
          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center animate-fade-in-up"
          style={{ backgroundColor: `${color}20`, animationDelay: '0.1s' }}
        >
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" style={{ color }}>
            <polyline points="1.5,5 4,7.5 8.5,2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
