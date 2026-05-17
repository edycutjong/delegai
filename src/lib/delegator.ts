/* ─────────────────────────────────────────────────────────
 * DelegAI — Delegator Module
 * Smart account creation + ERC-7715 permission requests
 * ───────────────────────────────────────────────────────── */

import type { Delegation, Caveat } from './types';
import { IS_DEMO, DEMO_ADDRESSES, toUsdcRaw, ROOT_BUDGET_USDC, ROOT_MAX_CALLS } from './constants';
import { createMockDelegationChain } from './mock-data';

/**
 * Create a MetaMask Smart Account for an agent.
 *
 * In production: calls toMetaMaskSmartAccount()
 * In demo mode: returns deterministic address
 */
export async function createSmartAccount(role: string): Promise<string> {
  if (IS_DEMO) {
    const addressMap: Record<string, string> = {
      user: DEMO_ADDRESSES.user,
      master: DEMO_ADDRESSES.master,
      'data-worker': DEMO_ADDRESSES.dataWorker,
      'exec-worker': DEMO_ADDRESSES.execWorker,
    };
    return addressMap[role] || `0x${role}...demo`;
  }

  // Production: MetaMask Smart Accounts Kit
  // const account = await toMetaMaskSmartAccount({ ... });
  // return account.address;
  throw new Error('Live mode not yet implemented — set DELEGAI_DEMO=true');
}

/**
 * Request execution permissions via ERC-7715.
 *
 * In production: triggers MetaMask Advanced Permissions popup
 * In demo mode: returns pre-signed root delegation
 */
export async function requestPermissions(): Promise<Delegation> {
  if (IS_DEMO) {
    const chain = createMockDelegationChain();
    return chain.root;
  }

  // Production: MetaMask ERC-7715
  // const permissions = await requestExecutionPermissions({ ... });
  throw new Error('Live mode not yet implemented — set DELEGAI_DEMO=true');
}

/**
 * Create a delegation with caveats.
 *
 * In production: calls createDelegation() + signDelegation()
 * In demo mode: returns mock delegation object
 */
export async function createDelegationWithCaveats(params: {
  delegator: string;
  delegate: string;
  caveats: Caveat[];
  parentDelegation?: string;
}): Promise<Delegation> {
  if (IS_DEMO) {
    return {
      id: `deleg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      delegator: params.delegator,
      delegate: params.delegate,
      caveats: params.caveats,
      salt: `0x${Date.now().toString(16)}`,
      parentDelegation: params.parentDelegation,
      signature: `0xmocksig_${Date.now()}`,
      status: 'active',
      createdAt: Date.now(),
    };
  }

  // Production:
  // const delegation = createDelegation({ ... });
  // const signed = await signDelegation(delegation, signer);
  throw new Error('Live mode not yet implemented — set DELEGAI_DEMO=true');
}

/**
 * Redeem (settle) a delegation chain on-chain.
 *
 * In production: calls redeemDelegations()
 * In demo mode: marks delegation as settled
 */
export async function settleDelegationChain(delegationId: string): Promise<void> {
  if (IS_DEMO) {
    // In demo mode, settlement is instant
    console.log(`[Demo] Delegation chain ${delegationId} settled`);
    return;
  }

  // Production:
  // await redeemDelegations([delegation], ...);
  throw new Error('Live mode not yet implemented — set DELEGAI_DEMO=true');
}

// Re-export for convenience
export { toUsdcRaw, ROOT_BUDGET_USDC, ROOT_MAX_CALLS };
