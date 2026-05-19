/* ─────────────────────────────────────────────────────────
 * DelegAI — x402 Seller Setup
 * Payment verification for protected premium data endpoints
 * ───────────────────────────────────────────────────────── */

import { IS_DEMO, CHAIN_ID, X402_FACILITATOR, X402_COST_PER_CALL } from './constants';

// EIP-712 types matching the DelegationManager signing schema
const DELEGATION_TYPES = {
  Caveat: [
    { name: 'enforcer', type: 'address' },
    { name: 'terms', type: 'bytes' },
  ],
  Delegation: [
    { name: 'delegate', type: 'address' },
    { name: 'delegator', type: 'address' },
    { name: 'authority', type: 'bytes32' },
    { name: 'caveats', type: 'Caveat[]' },
    { name: 'salt', type: 'uint256' },
  ],
} as const;

// In-memory anti-replay registry — resets on server restart (sufficient for demo scale)
const _usedSignatures = new Set<string>();

/**
 * Verify an x402 payment signature.
 *
 * Live mode:
 *   1. Rejects replayed signatures (anti-replay)
 *   2. Decodes the ERC-7710 delegation chain
 *   3. Cryptographically verifies the delegator's EIP-712 signature
 * Demo mode: accepts any PAYMENT-SIGNATURE header.
 */
export async function verifyPayment(paymentSignature: string | null): Promise<boolean> {
  if (IS_DEMO) {
    return true;
  }

  if (!paymentSignature) {
    return false;
  }

  // Anti-replay: reject previously-accepted signatures
  if (_usedSignatures.has(paymentSignature)) {
    return false;
  }

  try {
    const { decodeDelegations } = await import('@metamask/delegation-core');
    const { getSmartAccountsEnvironment } = await import('@metamask/smart-accounts-kit');
    const { verifyTypedData } = await import('viem');

    const delegations = decodeDelegations(paymentSignature as `0x${string}`);
    if (delegations.length === 0) return false;

    const delegation = delegations[0];
    if (!delegation.signature || delegation.signature === '0x') return false;

    const env = getSmartAccountsEnvironment(CHAIN_ID);

    const isValid = await verifyTypedData({
      address: delegation.delegator as `0x${string}`,
      domain: {
        chainId: CHAIN_ID,
        name: 'DelegationManager',
        version: '1',
        verifyingContract: env.DelegationManager as `0x${string}`,
      },
      types: DELEGATION_TYPES,
      primaryType: 'Delegation',
      message: {
        delegate: delegation.delegate,
        delegator: delegation.delegator,
        authority: delegation.authority,
        caveats: (delegation.caveats as { enforcer: `0x${string}`; terms: `0x${string}` }[]).map(
          (c) => ({ enforcer: c.enforcer, terms: c.terms })
        ),
        salt: delegation.salt,
      },
      signature: delegation.signature as `0x${string}`,
    });

    if (!isValid) return false;

    _usedSignatures.add(paymentSignature);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get payment requirement headers for 402 response.
 */
export function getPaymentRequirements(): Record<string, string> {
  return {
    'PAYMENT-REQUIRED': JSON.stringify({
      scheme: 'erc7710-exact-evm',
      network: 'ethereum-sepolia',
      maxAmountRequired: String(X402_COST_PER_CALL * 1e6), // USDC 6 decimals
      facilitator: X402_FACILITATOR,
    }),
  };
}

export { X402_COST_PER_CALL };
