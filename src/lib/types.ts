/* ─────────────────────────────────────────────────────────
 * DelegAI — Shared TypeScript Types
 * ───────────────────────────────────────────────────────── */

// ── Delegation Types ────────────────────────────────────

export type CaveatType = 'Erc20TransferAmount' | 'LimitedCalls' | 'Redeemer';

export interface Caveat {
  type: CaveatType;
  value: string | number;
}

export interface Delegation {
  id: string;
  delegator: string;
  delegate: string;
  caveats: Caveat[];
  salt: string;
  parentDelegation?: string;
  signature?: string;
  status: DelegationStatus;
  createdAt: number;
}

export type DelegationStatus =
  | 'pending'
  | 'active'
  | 'consumed'
  | 'settled'
  | 'expired'
  | 'revoked';

export interface DelegationChain {
  root: Delegation;
  subDelegations: Delegation[];
}

// ── Agent Types ─────────────────────────────────────────

export type AgentRole = 'user' | 'master' | 'data-worker' | 'exec-worker';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  address: string;
  status: AgentStatus;
  delegation?: Delegation;
  budget: Budget;
}

export type AgentStatus =
  | 'idle'
  | 'delegating'
  | 'working'
  | 'settling'
  | 'done'
  | 'error';

export interface Budget {
  allocated: number;
  consumed: number;
  currency: string;
  callsUsed: number;
  callsMax: number;
}

// ── Activity Feed Types ─────────────────────────────────

export type ActivityType =
  | 'delegation_created'
  | 'delegation_signed'
  | 'sub_delegation_created'
  | 'x402_payment_sent'
  | 'x402_data_received'
  | 'relay_submitted'
  | 'relay_confirmed'
  | 'chain_settled'
  | 'error';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  agent: AgentRole;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ── x402 Types ──────────────────────────────────────────

export interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
}

export interface PremiumDataResponse {
  timestamp: string;
  source: string;
  cost: string;
  [key: string]: unknown;
}

// ── 1Shot Relay Types ───────────────────────────────────

export interface RelayFeeData {
  feeToken: string;
  feeAmount: string;
  expiresAt: number;
}

export interface RelaySubmission {
  taskId: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export interface RelayStatus {
  taskId: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  txHash?: string;
}

// ── Demo Flow Types ─────────────────────────────────────

export interface DemoState {
  step: DemoStep;
  agents: Agent[];
  delegationChain?: DelegationChain;
  activities: ActivityEvent[];
  isRunning: boolean;
  error?: string;
}

export type DemoStep =
  | 'idle'
  | 'granting_permission'
  | 'creating_root_delegation'
  | 'redelegating_data_worker'
  | 'redelegating_exec_worker'
  | 'x402_payment'
  | 'x402_data_received'
  | 'relay_submitting'
  | 'relay_confirmed'
  | 'settling'
  | 'complete';
