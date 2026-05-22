'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';
import type { Agent, DelegationChain, DemoStep } from '@/lib/types';
import { AGENT_COLORS, BLOCK_EXPLORER, USDC_ADDRESS } from '@/lib/constants';
import { AddressBadge } from './AddressBadge';

interface DelegationTreeProps {
  agents: Agent[];
  chain: DelegationChain | null;
  step: DemoStep;
  txHash?: string;
}

const STEP_ORDER: DemoStep[] = [
  'idle',
  'granting_permission',
  'creating_root_delegation',
  'redelegating_data_worker',
  'redelegating_exec_worker',
  'x402_payment',
  'x402_data_received',
  'relay_submitting',
  'relay_confirmed',
  'settling',
  'complete',
];

function stepIndex(s: DemoStep) {
  return STEP_ORDER.indexOf(s);
}

export function DelegationTree({ agents, chain, step, txHash }: DelegationTreeProps) {
  const user       = agents.find((a) => a.role === 'user');
  const master     = agents.find((a) => a.role === 'master');
  const dataWorker = agents.find((a) => a.role === 'data-worker');
  const execWorker = agents.find((a) => a.role === 'exec-worker');

  const si = stepIndex(step);
  const isActive     = si > 0;
  const masterActive = si >= stepIndex('creating_root_delegation');
  const workersActive = si >= stepIndex('redelegating_data_worker');

  // Is the root connector actively flowing?
  const rootFlowing = isActive && si < stepIndex('complete') && masterActive;
  const subFlowing  = workersActive && si < stepIndex('complete');

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
        enterDelay={0}
      />

      {/* Root connector + Master */}
      <div className="flex ml-3.5" style={{ minHeight: 32 }}>
        {/* Connector line */}
        <div className="relative flex flex-col items-center" style={{ width: 2 }}>
          <div
            className={`w-full flex-1 rounded-full transition-all duration-700 ${
              rootFlowing ? 'animate-dash-flow' : isActive ? 'bg-primary/30' : 'bg-border'
            }`}
          />
        </div>

        <div className="flex-1 pl-4 pt-1 pb-1">
          {masterActive ? (
            <TreeNode
              label="Master Agent"
              address={master?.address}
              color={AGENT_COLORS['master']}
              status={master?.status}
              budget="Redelegates ↓"
              isActive={masterActive}
              enterDelay={120}
            />
          ) : (
            <div className="h-14 rounded-lg border border-dashed border-border opacity-30 flex items-center px-3">
              <span className="text-xs text-text-muted font-mono">Awaiting root delegation…</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-delegation connectors + workers */}
      {masterActive && (
        <div className="flex ml-3.5">
          {/* Vertical spine */}
          <div className="relative flex flex-col items-center" style={{ width: 2 }}>
            <div
              className={`w-full flex-1 rounded-full transition-all duration-700 ${
                subFlowing ? 'animate-dash-flow-violet' : workersActive ? 'bg-info/30' : 'bg-border'
              }`}
            />
          </div>

          <div className="flex-1 pl-4 pt-1 space-y-3 pb-1">
            {/* Data Worker */}
            {workersActive ? (
              <TreeNode
                label="Data Worker"
                address={dataWorker?.address}
                color={AGENT_COLORS['data-worker']}
                status={dataWorker?.status}
                budget={
                  (dataWorker?.budget.allocated ?? 0) > 0
                    ? `${dataWorker!.budget.allocated} USDC · x402`
                    : 'Awaiting delegation'
                }
                isActive={si >= stepIndex('x402_payment')}
                enterDelay={200}
              />
            ) : (
              <div className="h-14 rounded-lg border border-dashed border-border opacity-30 flex items-center px-3">
                <span className="text-xs text-text-muted font-mono">Data Worker slot…</span>
              </div>
            )}

            {/* Exec Worker */}
            {si >= stepIndex('redelegating_exec_worker') ? (
              <TreeNode
                label="Exec Worker"
                address={execWorker?.address}
                color={AGENT_COLORS['exec-worker']}
                status={execWorker?.status}
                budget={
                  (execWorker?.budget.allocated ?? 0) > 0
                    ? `${execWorker!.budget.allocated} USDC · 1Shot`
                    : 'Awaiting delegation'
                }
                isActive={si >= stepIndex('relay_submitting')}
                enterDelay={320}
              />
            ) : (
              <div className="h-14 rounded-lg border border-dashed border-border opacity-30 flex items-center px-3">
                <span className="text-xs text-text-muted font-mono">Exec Worker slot…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settlement block */}
      {chain && step === 'complete' && (
        <div className="mt-5 relative flex flex-col gap-4 animate-settle-appear">
          <div className="relative flex items-center justify-center">
            <span className="absolute inset-0 rounded-xl border border-success/50 animate-settle-ring pointer-events-none" />
            <span className="absolute inset-0 rounded-xl border border-success/25 animate-settle-ring-2 pointer-events-none" />

            <div className="relative w-full p-3 rounded-xl bg-success/10 border border-success/40 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle2 size={16} className="text-success" />
                <p className="text-success text-sm font-semibold">Chain Settled on Sepolia</p>
              </div>
              <p className="text-xs text-text-muted font-mono mb-2">
                All delegations consumed · ERC-7710 verified
              </p>
              {txHash ? (
                <div className="flex flex-col items-center gap-1.5">
                  {txHash === '0x95f4c6e0c8a9c2b7f23812206d8a1c36078a641ae8c0572f9b6217c1ce35a472' && (
                    <span className="text-[9px] uppercase font-mono text-info tracking-wider bg-info/10 border border-info/30 px-1.5 py-0.5 rounded animate-pulse">
                      Pre-signed On-chain Proof
                    </span>
                  )}
                  <a
                    href={`${BLOCK_EXPLORER}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/20 border border-success/40 text-success text-xs font-mono hover:bg-success/30 transition-colors"
                  >
                    <ExternalLink size={11} />
                    {txHash.slice(0, 10)}…{txHash.slice(-6)} · View on Etherscan
                  </a>
                </div>
              ) : (
                <p className="text-xs text-text-muted font-mono opacity-50">Demo mode · no on-chain tx</p>
              )}
            </div>
          </div>

          {/* Action details block */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-success/30 text-left space-y-2.5">
            <p className="text-[11px] uppercase tracking-wider font-mono text-success/80 font-bold">
              Executed On-Chain Action Details
            </p>
            
            <div className="grid grid-cols-3 gap-y-1.5 gap-x-1 text-[11px] font-mono text-text-secondary">
              <span className="text-text-muted">Function:</span>
              <span className="col-span-2 text-success font-semibold">redeemDelegations(...)</span>

              <span className="text-text-muted">Contract:</span>
              <span className="col-span-2 text-text-primary">
                USDC ({USDC_ADDRESS.slice(0, 6)}...{USDC_ADDRESS.slice(-4)})
              </span>

              <span className="text-text-muted">Calldata:</span>
              <span className="col-span-2 text-warning overflow-hidden text-ellipsis whitespace-nowrap" title={`transfer(to: ${execWorker?.address || 'ExecWorker'}, amount: 1)`}>
                transfer({execWorker?.address ? `${execWorker.address.slice(0, 6)}...${execWorker.address.slice(-4)}` : 'ExecWorker'}, 1)
              </span>

              <span className="text-text-muted">Value:</span>
              <span className="col-span-2 text-text-primary">0 ETH</span>

              <span className="text-text-muted">Proof Flow:</span>
              <span className="col-span-2 text-text-primary text-[10px]">
                User SA &rarr; Master &rarr; Exec Worker (Redeemer)
              </span>
            </div>
            
            <p className="text-[10px] text-text-muted leading-relaxed font-sans border-t border-border/40 pt-2">
              The delegate redeemed the chain to execute a <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">transfer(recipient, 0.000001 USDC)</code> on-chain. This cryptographically verified that the EIP-712 signature chain and the ERC-7710 caveats are fully validated and enforced by the MetaMask DelegationManager contract on Sepolia.
            </p>
          </div>
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
  enterDelay,
}: {
  label: string;
  address?: string;
  color: string;
  status?: string;
  budget: string;
  isActive: boolean;
  enterDelay: number;
}) {
  const isWorking = status === 'working' || status === 'delegating';
  const isDone    = status === 'done';

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 relative overflow-hidden animate-node-enter ${
        isWorking ? 'animate-glow-pulse' : ''
      }`}
      style={{
        animationDelay: `${enterDelay}ms`,
        borderLeft: `3px solid ${isActive ? color : 'transparent'}`,
        backgroundColor: isActive ? 'rgba(51, 65, 85, 0.3)' : 'transparent',
        opacity: isActive ? 1 : 0.35,
        transition: 'background-color 0.4s, opacity 0.4s, border-color 0.4s',
      }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {label[0]}
        </div>
        {isWorking && (
          <span
            className="absolute inset-0 rounded-full animate-ping-ring"
            style={{ backgroundColor: `${color}35` }}
          />
        )}
        {isDone && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <svg viewBox="0 0 8 8" className="w-2 h-2 text-bg-base">
              <polyline points="1,4 3,6.5 7,1.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        <p
          key={budget}
          className="text-xs text-text-muted font-mono animate-step-flash"
        >
          {budget}
        </p>
        {address && (
          <AddressBadge
            address={address}
            startChars={10}
            endChars={4}
            minimal
            className="text-xs opacity-60"
          />
        )}
      </div>

      {/* Status dot */}
      {isActive && (
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${
            isDone    ? 'bg-success' :
            isWorking ? 'bg-warning animate-pulse' :
            'bg-text-muted'
          }`}
        />
      )}
    </div>
  );
}
