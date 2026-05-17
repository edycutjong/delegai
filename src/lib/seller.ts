/* ─────────────────────────────────────────────────────────
 * DelegAI — x402 Seller Setup
 * Express middleware for protected premium data endpoints
 * ───────────────────────────────────────────────────────── */

import { IS_DEMO, X402_FACILITATOR, X402_COST_PER_CALL } from './constants';

/**
 * x402 payment verification.
 *
 * In production: uses @x402/express paymentMiddleware with
 *   Erc7710ExactEvmScheme + HTTPFacilitatorClient
 *
 * In demo mode: accepts any PAYMENT-SIGNATURE header
 */
export function verifyPayment(paymentSignature: string | null): boolean {
  if (IS_DEMO) {
    // Demo mode accepts any signature (including null for scripted flow)
    return true;
  }

  if (!paymentSignature) {
    return false;
  }

  // Production: verify via facilitator
  // const facilitator = new HTTPFacilitatorClient(X402_FACILITATOR);
  // return facilitator.verify(paymentSignature, ...);
  return false;
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
