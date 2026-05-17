import type { Agent } from '@/lib/types';
import { AGENT_COLORS } from '@/lib/constants';
import { BudgetMeter } from './BudgetMeter';
import { CaveatBadge } from './CaveatBadge';

interface AgentCardProps {
  agent: Agent;
}

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  idle: { dot: 'bg-text-muted', label: 'Idle' },
  delegating: { dot: 'bg-info animate-pulse', label: 'Delegating' },
  working: { dot: 'bg-warning animate-pulse', label: 'Working' },
  settling: { dot: 'bg-primary animate-pulse', label: 'Settling' },
  done: { dot: 'bg-success', label: 'Done' },
  error: { dot: 'bg-danger', label: 'Error' },
};

const ROLE_LABELS: Record<string, string> = {
  user: 'User (EOA)',
  master: 'Master Agent',
  'data-worker': 'Data Worker',
  'exec-worker': 'Exec Worker',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  user: 'Root delegator — grants spending authority',
  master: 'Orchestrator — creates sub-delegations',
  'data-worker': 'x402 buyer — pays for premium data',
  'exec-worker': '1Shot executor — gasless transactions',
};

export function AgentCard({ agent }: AgentCardProps) {
  const statusStyle = STATUS_STYLES[agent.status] || STATUS_STYLES.idle;
  const color = AGENT_COLORS[agent.role] || '#94a3b8';

  return (
    <div
      className={`glass-card p-4 transition-all duration-300 ${
        agent.status === 'working' || agent.status === 'delegating'
          ? 'animate-glow-pulse'
          : ''
      }`}
      style={{
        borderColor:
          agent.status !== 'idle'
            ? `${color}40`
            : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {agent.role === 'user'
              ? 'U'
              : agent.role === 'master'
              ? 'M'
              : agent.role === 'data-worker'
              ? 'D'
              : 'E'}
          </div>
          <span className="text-sm font-semibold">{ROLE_LABELS[agent.role]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
          <span className="text-xs text-text-muted font-[family-name:var(--font-mono)]">
            {statusStyle.label}
          </span>
        </div>
      </div>

      <p className="text-xs text-text-muted mb-3">{ROLE_DESCRIPTIONS[agent.role]}</p>

      <div className="text-xs font-[family-name:var(--font-mono)] text-text-muted mb-2 truncate">
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
    </div>
  );
}
