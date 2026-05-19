import { CheckCircle2 } from 'lucide-react';
import type { Agent, DelegationChain, DemoStep } from '@/lib/types';
import { AGENT_COLORS } from '@/lib/constants';

interface DelegationTreeProps {
  agents: Agent[];
  chain: DelegationChain | null;
  step: DemoStep;
}

export function DelegationTree({ agents, chain, step }: DelegationTreeProps) {
  const user = agents.find((a) => a.role === 'user');
  const master = agents.find((a) => a.role === 'master');
  const dataWorker = agents.find((a) => a.role === 'data-worker');
  const execWorker = agents.find((a) => a.role === 'exec-worker');

  const isActive = step !== 'idle';

  return (
    <div className="glass-card-glow p-6 min-h-[400px]">
      {/* User Node */}
      <TreeNode
        label="User (EOA)"
        address={user?.address}
        color={AGENT_COLORS['user']}
        status={user?.status}
        budget="50 USDC · 5 calls"
        isActive={isActive}
      />

      {/* Connector */}
      <div className={`ml-6 pl-4 border-l-2 py-2 transition-all duration-500 ${isActive ? 'border-primary/60 animate-tree-flow' : 'border-primary/20'}`}>
        {/* Master Node */}
        <TreeNode
          label="Master Agent"
          address={master?.address}
          color={AGENT_COLORS['master']}
          status={master?.status}
          budget="Redelegates ↓"
          isActive={isActive && step !== 'granting_permission'}
        />

        <div className={`ml-6 pl-4 border-l-2 py-2 space-y-3 transition-all duration-500 ${isActive && step !== 'granting_permission' && step !== 'creating_root_delegation' ? 'border-info/60 animate-tree-flow' : 'border-info/20'}`}>
          {/* Data Worker */}
          <TreeNode
            label="Data Worker"
            address={dataWorker?.address}
            color={AGENT_COLORS['data-worker']}
            status={dataWorker?.status}
            budget={(dataWorker?.budget.allocated ?? 0) > 0 ? `${dataWorker!.budget.allocated} USDC · x402` : 'Awaiting delegation'}
            isActive={isActive && ['x402_payment', 'x402_data_received', 'relay_submitting', 'relay_confirmed', 'settling', 'complete'].includes(step)}
          />

          {/* Exec Worker */}
          <TreeNode
            label="Exec Worker"
            address={execWorker?.address}
            color={AGENT_COLORS['exec-worker']}
            status={execWorker?.status}
            budget={(execWorker?.budget.allocated ?? 0) > 0 ? `${execWorker!.budget.allocated} USDC · 1Shot` : 'Awaiting delegation'}
            isActive={isActive && ['relay_submitting', 'relay_confirmed', 'settling', 'complete'].includes(step)}
          />
        </div>
      </div>

      {/* Settlement Status */}
      {chain && step === 'complete' && (
        <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30 text-center flex flex-col items-center animate-fade-in-up">
          <p className="text-success text-sm font-semibold flex items-center gap-2 justify-center"><CheckCircle2 size={16} /> Chain Settled</p>
          <p className="text-xs text-text-muted mt-1 font-mono">
            All delegations consumed and verified
          </p>
        </div>
      )}
    </div>
  );
}

function TreeNode({
  label,
  address,
  color,
  status,
  budget,
  isActive,
}: {
  label: string;
  address?: string;
  color: string;
  status?: string;
  budget: string;
  isActive: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
        isActive ? 'bg-bg-elevated/40' : 'opacity-40'
      } ${status === 'working' ? 'animate-glow-pulse' : ''}`}
      style={{ borderLeft: `3px solid ${isActive ? color : 'transparent'}` }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {label[0]}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-text-muted font-mono">
          {budget}
        </p>
        {address && (
          <p className="text-xs text-text-muted font-mono truncate">
            {address.slice(0, 10)}...
          </p>
        )}
      </div>
    </div>
  );
}
