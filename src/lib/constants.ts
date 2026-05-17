/* ─────────────────────────────────────────────────────────
 * DelegAI — Constants & Configuration
 * ───────────────────────────────────────────────────────── */

// ── Chain Config ────────────────────────────────────────

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
export const CHAIN_NAME = 'Ethereum Sepolia';
export const BLOCK_EXPLORER = 'https://sepolia.etherscan.io';

// ── Demo Mode ───────────────────────────────────────────

export const IS_DEMO = process.env.DELEGAI_DEMO === 'true' || process.env.NEXT_PUBLIC_DELEGAI_DEMO === 'true';
export const DEMO_SPEED = process.env.DELEGAI_DEMO_SPEED || 'normal';

/** Delay in ms between demo steps */
export const STEP_DELAY = DEMO_SPEED === 'fast' ? 500 : 1500;

// ── Addresses (Demo Mode — Deterministic) ───────────────

export const DEMO_ADDRESSES = {
  user: '0xAl1c3000000000000000000000000000000dEaD1',
  master: '0xMa5t3R00000000000000000000000000000dEaD2',
  dataWorker: '0xDa7a000000000000000000000000000000dEaD3',
  execWorker: '0x3x3c000000000000000000000000000000dEaD4',
  usdc: '0xU5DC0000000000000000000000000000000dEaD5',
} as const;

// ── Delegation Defaults ─────────────────────────────────

export const ROOT_BUDGET_USDC = 50;
export const ROOT_MAX_CALLS = 5;
export const WORKER_BUDGET_USDC = 10;
export const WORKER_MAX_CALLS = 2;
export const X402_COST_PER_CALL = 0.01;

/** USDC has 6 decimals */
export const USDC_DECIMALS = 6;

/** Convert USDC amount to raw units */
export function toUsdcRaw(amount: number): string {
  return String(Math.round(amount * 10 ** USDC_DECIMALS));
}

// ── 1Shot Relay ─────────────────────────────────────────

export const ONESHOT_ENDPOINT =
  process.env.ONESHOT_ENDPOINT || 'https://relayer.1shotapi.com/relayers';

// ── x402 ────────────────────────────────────────────────

export const X402_FACILITATOR =
  process.env.X402_FACILITATOR || 'https://facilitator.metamask.io';

// ── UI / Design Tokens ──────────────────────────────────

export const COLORS = {
  primary: '#06b6d4',    // Cyan 500 — delegation/MetaMask
  success: '#22c55e',    // Green 500 — settled/confirmed
  warning: '#f59e0b',    // Amber 500 — pending/processing
  danger: '#ef4444',     // Red 500 — errors/exceeded
  info: '#8b5cf6',       // Violet 500 — agent activity
  bgBase: '#0f172a',     // Slate 900 — dark base
  bgSurface: '#1e293b',  // Slate 800 — card surfaces
  border: '#334155',     // Slate 700 — subtle borders
  textPrimary: '#f8fafc', // Slate 50 — main text
  textSecondary: '#94a3b8', // Slate 400 — muted text
} as const;

export const AGENT_COLORS: Record<string, string> = {
  user: COLORS.primary,
  master: COLORS.info,
  'data-worker': COLORS.warning,
  'exec-worker': COLORS.success,
};
