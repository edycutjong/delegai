/* ─────────────────────────────────────────────────────────
 * DelegAI — ERC-7710 Bundler & ERC-7715 Provider Clients
 * Viem client factories extended with Smart Accounts Kit actions
 * ───────────────────────────────────────────────────────── */

import { IS_DEMO, CHAIN_ID } from './constants';

/**
 * Create a viem client extended with erc7710BundlerActions for submitting
 * UserOperations that carry ERC-7710 delegation chains.
 * Returns null in demo mode (no bundler endpoint required).
 */
export async function createErc7710BundlerClient(bundlerUrl: string) {
  if (IS_DEMO) return null;

  const { createPublicClient, http } = await import('viem');
  const { erc7710BundlerActions } = await import('@metamask/smart-accounts-kit/actions');

  return createPublicClient({
    chain: { id: CHAIN_ID } as Parameters<typeof createPublicClient>[0]['chain'],
    transport: http(bundlerUrl),
  }).extend(erc7710BundlerActions());
}

/**
 * Create a viem client extended with erc7715ProviderActions for requesting
 * execution permissions from MetaMask wallets via ERC-7715.
 * Returns null in demo mode (no wallet RPC required).
 */
export async function createErc7715ProviderClient(providerUrl: string) {
  if (IS_DEMO) return null;

  const { createPublicClient, http } = await import('viem');
  const { erc7715ProviderActions } = await import('@metamask/smart-accounts-kit/actions');

  return createPublicClient({
    chain: { id: CHAIN_ID } as Parameters<typeof createPublicClient>[0]['chain'],
    transport: http(providerUrl),
  }).extend(erc7715ProviderActions());
}
