<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🤖 DelegAI — Agent Instructions

## Project
Autonomous Agent Delegation Network. AI coordinator agent that autonomously hires, scopes, and pays specialist AI agents via MetaMask redelegation chains and x402 micropayments — creating the first trustless M2M delegation economy.

## Hackathon
**MetaMask Smart Accounts Kit x 1Shot API Dev Cook Off** (HackQuest) — Targeting Best A2A Coordination ($1,500) + Best Agent ($1,500) + Best x402/ERC-7710 ($1,500) = triple-track stacking.

## Structure
- `src/app/` — Next.js 16 App Router pages (landing, dashboard, API routes)
- `src/components/` — React 19 components (DelegationTree, AgentCard, BudgetMeter, ActivityFeed)
- `src/agents/` — Agent logic (orchestrator, data-worker, exec-worker)
- `src/lib/` — Shared types, constants, delegation helpers, relay client, x402 buyer/seller
- `src/__tests__/` — Jest test suites (unit + integration)
- `scripts/` — Demo, seed, bench, verify scripts
- `docs/` — Demo script, SDK feedback

## Tech Stack
| Layer | Technology |
|---|---|
| **Dashboard** | Next.js 16 (App Router), React 19 |
| **Styling** | Tailwind CSS v4 |
| **Agent Runtime** | Express 5.x (embedded in Next.js API routes) |
| **Smart Accounts** | @metamask/smart-accounts-kit 1.5.x |
| **x402** | @x402/core, @x402/evm, @x402/express |
| **Relay** | 1Shot Public Relayer (JSON-RPC) |
| **Chain** | Ethereum Sepolia (ChainId: 11155111) |
| **Testing** | Jest + Supertest |
| **Deploy** | Vercel |

## Key Rules
- **Frontend** = ESM (`import`), Next.js 16, React 19, Tailwind v4
- **Tests** = Jest globals (`describe`/`it`/`expect`), NOT vitest — no explicit imports needed
- **Demo Mode** = `DELEGAI_DEMO=true` uses mock data — no wallet/testnet needed
- **CI** = `npm run ci` → lint + typecheck + test:coverage (must pass 100%)
- **Colors** = Cyan (#06b6d4) for delegation/primary, Green (#22c55e) for settled, Amber (#f59e0b) for pending, Red (#ef4444) for errors, Violet (#8b5cf6) for agent activity
- **Typography** = Orbitron (headings), Inter (body), JetBrains Mono (code/data)
- **Aesthetic** = Military SOC / Command Center, dark mode only, glassmorphism cards

## Critical Patterns
- All state initialization uses **lazy initializers** (not setState-in-useEffect)
- `params` is a **Promise** in Next.js 16 — must `await`
- `PageProps<'/path'>` and `RouteContext<'/path'>` are global type helpers
- Components using hooks must have `'use client'` directive
- Ref updates go in `useEffect`, never during render
- Unused catch variables use underscore prefix (`_err`)

## SDK Surface (18 Integration Points)
1. `toMetaMaskSmartAccount()` — Agent smart accounts
2. `createDelegation()` — Root + sub-delegations
3. `createOpenDelegation()` — x402 buyer
4. `signDelegation()` — Sign chains
5. `redeemDelegations()` — Settle chains
6. `createCaveatBuilder()` — LimitedCalls + Redeemer + Erc20TransferAmount
7. `encodeDelegations()` — Transport encoding
8. `hashDelegation()` — Chain linking
9. `requestExecutionPermissions()` — ERC-7715
10. `sendUserOperationWithDelegation()` — UserOp execution
11. `erc7710BundlerActions()` — Bundler extension
12. `erc7715ProviderActions()` — Wallet client extension
13. `@x402/express` paymentMiddleware — Seller
14. `@x402/evm` Erc7710ExactEvmScheme — Payment verification
15. `@x402/core` HTTPFacilitatorClient — Facilitator
16. 1Shot `relayer_getFeeData` — Gas quotes
17. 1Shot `relayer_send7710Transaction` — Gasless relay
18. 1Shot `relayer_getStatus` — Status polling
