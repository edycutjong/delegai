/* ─────────────────────────────────────────────────────────
 * DelegAI — Mock Data for Demo Mode
 * ───────────────────────────────────────────────────────── */

import type {
  Agent,
  DelegationChain,
  ActivityEvent,
  PremiumDataResponse,
  RelayFeeData,
  RelaySubmission,
  RelayStatus,
} from './types';
import {
  DEMO_ADDRESSES,
  ROOT_BUDGET_USDC,
  ROOT_MAX_CALLS,
  WORKER_MAX_CALLS,
} from './constants';

// ── Mock Agents ─────────────────────────────────────────

export function createMockAgents(): Agent[] {
  return [
    {
      id: 'agent-user',
      name: 'Alice (User)',
      role: 'user',
      address: DEMO_ADDRESSES.user,
      status: 'idle',
      budget: {
        allocated: ROOT_BUDGET_USDC,
        consumed: 0,
        currency: 'USDC',
        callsUsed: 0,
        callsMax: ROOT_MAX_CALLS,
      },
    },
    {
      id: 'agent-master',
      name: 'Master Agent',
      role: 'master',
      address: DEMO_ADDRESSES.master,
      status: 'idle',
      budget: {
        allocated: 0,
        consumed: 0,
        currency: 'USDC',
        callsUsed: 0,
        callsMax: 0,
      },
    },
    {
      id: 'agent-data',
      name: 'Data Worker',
      role: 'data-worker',
      address: DEMO_ADDRESSES.dataWorker,
      status: 'idle',
      budget: {
        allocated: 0,
        consumed: 0,
        currency: 'USDC',
        callsUsed: 0,
        callsMax: 0,
      },
    },
    {
      id: 'agent-exec',
      name: 'Exec Worker',
      role: 'exec-worker',
      address: DEMO_ADDRESSES.execWorker,
      status: 'idle',
      budget: {
        allocated: 0,
        consumed: 0,
        currency: 'USDC',
        callsUsed: 0,
        callsMax: 0,
      },
    },
  ];
}

// ── Mock Delegation Chain ───────────────────────────────

export function createMockDelegationChain(): DelegationChain {
  const now = Date.now();
  return {
    root: {
      id: 'deleg-root-001',
      delegator: DEMO_ADDRESSES.user,
      delegate: DEMO_ADDRESSES.master,
      caveats: [
        { type: 'Erc20TransferAmount', value: '50000000' },
        { type: 'LimitedCalls', value: 5 },
      ],
      salt: '0x0001',
      status: 'active',
      signature: '0xdeadbeef...rootsig',
      createdAt: now,
    },
    subDelegations: [
      {
        id: 'deleg-data-001',
        delegator: DEMO_ADDRESSES.master,
        delegate: DEMO_ADDRESSES.dataWorker,
        caveats: [
          { type: 'Erc20TransferAmount', value: '10000000' },
          { type: 'LimitedCalls', value: WORKER_MAX_CALLS },
          { type: 'Redeemer', value: DEMO_ADDRESSES.dataWorker },
        ],
        salt: '0x0002',
        parentDelegation: 'deleg-root-001',
        status: 'active',
        signature: '0xdeadbeef...datasig',
        createdAt: now + 100,
      },
      {
        id: 'deleg-exec-001',
        delegator: DEMO_ADDRESSES.master,
        delegate: DEMO_ADDRESSES.execWorker,
        caveats: [
          { type: 'Erc20TransferAmount', value: '10000000' },
          { type: 'LimitedCalls', value: WORKER_MAX_CALLS },
          { type: 'Redeemer', value: DEMO_ADDRESSES.execWorker },
        ],
        salt: '0x0003',
        parentDelegation: 'deleg-root-001',
        status: 'active',
        signature: '0xdeadbeef...execsig',
        createdAt: now + 200,
      },
    ],
  };
}

// ── Mock Premium Data ───────────────────────────────────

export const MOCK_MARKET_FEED: PremiumDataResponse = {
  timestamp: '2026-05-16T12:00:00Z',
  assets: [
    { symbol: 'ETH', price: 3842.50, change24h: 2.3 },
    { symbol: 'USDC', price: 1.00, change24h: 0.0 },
    { symbol: 'WBTC', price: 98750.00, change24h: -1.2 },
  ],
  source: 'DelegAI Premium Oracle',
  cost: '0.01 USDC',
};

export const MOCK_DEFI_YIELDS: PremiumDataResponse = {
  timestamp: '2026-05-16T12:00:00Z',
  protocols: [
    { name: 'Aave v3', chain: 'Ethereum', apy: 5.8, tvl: '4.2B' },
    { name: 'Compound', chain: 'Ethereum', apy: 4.2, tvl: '2.1B' },
    { name: 'Lido', chain: 'Ethereum', apy: 3.4, tvl: '14.8B' },
  ],
  source: 'DelegAI Yield Scanner',
  cost: '0.01 USDC',
};

// ── Mock Relay Responses ────────────────────────────────

export const MOCK_FEE_DATA: RelayFeeData = {
  feeToken: DEMO_ADDRESSES.usdc,
  feeAmount: '30000',
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
};

export const MOCK_RELAY_SUBMISSION: RelaySubmission = {
  taskId: 'task_demo_001',
  status: 'PENDING',
};

export const MOCK_RELAY_STATUS: RelayStatus = {
  taskId: 'task_demo_001',
  status: 'CONFIRMED',
  txHash: '0xdemo7x4a5h000000000000000000000000000000000000000000000000dead',
};

// ── Mock Activity Events ────────────────────────────────

export function createMockActivities(): ActivityEvent[] {
  const now = Date.now();
  return [
    {
      id: 'evt-001',
      type: 'delegation_created',
      agent: 'user',
      message: 'Root delegation created: 50 USDC, 5 calls max',
      timestamp: now,
      metadata: { budget: 50, calls: 5 },
    },
    {
      id: 'evt-002',
      type: 'delegation_signed',
      agent: 'user',
      message: 'Delegation signed via MetaMask Advanced Permissions',
      timestamp: now + 500,
    },
    {
      id: 'evt-003',
      type: 'sub_delegation_created',
      agent: 'master',
      message: 'Sub-delegation → Data Worker: 10 USDC, 2 calls',
      timestamp: now + 1000,
      metadata: { worker: 'data-worker', budget: 10, calls: 2 },
    },
    {
      id: 'evt-004',
      type: 'sub_delegation_created',
      agent: 'master',
      message: 'Sub-delegation → Exec Worker: 10 USDC, 2 calls',
      timestamp: now + 1500,
      metadata: { worker: 'exec-worker', budget: 10, calls: 2 },
    },
    {
      id: 'evt-005',
      type: 'x402_payment_sent',
      agent: 'data-worker',
      message: 'x402 payment: 0.01 USDC → /api/premium-data/market-feed',
      timestamp: now + 2000,
      metadata: { endpoint: '/api/premium-data/market-feed', cost: 0.01 },
    },
    {
      id: 'evt-006',
      type: 'x402_data_received',
      agent: 'data-worker',
      message: 'Premium data received: 3 assets (ETH, USDC, WBTC)',
      timestamp: now + 2500,
    },
    {
      id: 'evt-007',
      type: 'relay_submitted',
      agent: 'exec-worker',
      message: '1Shot relay: UserOp submitted (gas: 0.03 USDC)',
      timestamp: now + 3000,
      metadata: { taskId: 'task_demo_001', gasUsdc: 0.03 },
    },
    {
      id: 'evt-008',
      type: 'relay_confirmed',
      agent: 'exec-worker',
      message: '1Shot relay confirmed: tx 0xdemo...dead',
      timestamp: now + 4000,
      metadata: { txHash: '0xdemo...dead' },
    },
    {
      id: 'evt-009',
      type: 'chain_settled',
      agent: 'master',
      message: 'Delegation chain settled. Total consumed: 10.04 / 50 USDC',
      timestamp: now + 5000,
      metadata: { consumed: 10.04, allocated: 50 },
    },
  ];
}
