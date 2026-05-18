# 🏗️ Architecture — DelegAI

> Autonomous Agent Delegation Network — 3-level hierarchical spending authority on MetaMask Smart Accounts Kit

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DelegAI Architecture                     │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Dashboard   │    │ Agent Runtime │    │  x402 Seller │  │
│  │  (Next.js 16) │◄──►│  (Express)    │◄──►│  (Express MW)│  │
│  │  React 19     │    │  Orchestrator │    │  /api/premium│  │
│  │  Tailwind v4  │    │  Workers      │    │  -data/*     │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                    │                    │          │
│  ┌──────▼────────────────────▼────────────────────▼───────┐ │
│  │              Smart Accounts Kit Layer                   │ │
│  │  toMetaMaskSmartAccount() │ createDelegation()          │ │
│  │  signDelegation()         │ redeemDelegations()         │ │
│  │  createCaveatBuilder()    │ encodeDelegations()         │ │
│  │  hashDelegation()         │ requestExecutionPermissions │ │
│  │  sendUserOperationWithDelegation()                      │ │
│  └──────┬─────────────────────────────────────────────────┘ │
│         │                                                    │
│  ┌──────▼────────────────────────────────────────────────┐  │
│  │                 On-Chain Layer                         │  │
│  │  Ethereum Sepolia │ USDC (testnet) │ 1Shot Relayer    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Delegation Chain Model

```
User (EOA)
  │
  ├── requestExecutionPermissions() → MetaMask popup
  │   Caveats: Erc20TransferAmount(50 USDC), LimitedCalls(5)
  │
  └── Root Delegation
        │
        ├── Master Agent (Smart Account)
        │     │
        │     ├── createDelegation(parentDelegation: rootHash)
        │     │   Caveats: Erc20TransferAmount(10 USDC),
        │     │            LimitedCalls(2), Redeemer(dataWorker)
        │     │
        │     ├── Sub-Delegation → Data Worker (Smart Account)
        │     │     └── x402 buyer: pays 0.01 USDC per API call
        │     │         via createOpenDelegation() + PAYMENT-SIGNATURE
        │     │
        │     ├── createDelegation(parentDelegation: rootHash)
        │     │   Caveats: Erc20TransferAmount(10 USDC),
        │     │            LimitedCalls(2), Redeemer(execWorker)
        │     │
        │     └── Sub-Delegation → Exec Worker (Smart Account)
        │           └── 1Shot relay: gasless tx via
        │               relayer_send7710Transaction
        │
        └── redeemDelegations() → Chain settles on-chain
```

---

## Component Architecture

### 1. Dashboard (Next.js 16 App Router)

| Route | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Hero + "Start Delegation" CTA |
| `/dashboard` | `DashboardPage` | Main delegation control center |
| `/api/sse` | `SSE Route` | Server-Sent Events for live updates |

**Key UI Components:**
- `DelegationTree` — Animated hierarchical tree visualization
- `AgentCard` — Per-agent status (active/pending/consumed/settled)
- `BudgetMeter` — Real-time budget consumption bar per delegation level
- `ActivityFeed` — SSE-powered live event log
- `CaveatBadge` — Visual caveat type indicators

### 2. Agent Runtime (Express Server)

| Module | File | Responsibility |
|---|---|---|
| **Orchestrator** | `src/agents/orchestrator.ts` | Creates delegation chain, dispatches to workers |
| **Data Worker** | `src/agents/data-worker.ts` | x402 buyer — fetches premium data |
| **Exec Worker** | `src/agents/exec-worker.ts` | 1Shot executor — gasless transactions |
| **Delegator** | `src/lib/delegator.ts` | Smart account creation + ERC-7715 permissions |
| **Relay** | `src/lib/relay.ts` | 1Shot API client (getFeeData, send, getStatus) |
| **Buyer** | `src/lib/buyer.ts` | x402 buyer flow (open delegation + payment header) |

### 3. x402 Seller (Express Middleware)

| Route | Price | Data |
|---|---|---|
| `/api/premium-data/market-feed` | 0.01 USDC | ETH/USDC/WBTC prices |
| `/api/premium-data/defi-yields` | 0.01 USDC | Aave/Compound/Lido APYs |

Built with `@x402/express` `paymentMiddleware` + `Erc7710ExactEvmScheme`.

---

## Data Flow — The ONE Core Flow

```
Step 1: GRANT PERMISSION
  User → MetaMask popup → requestExecutionPermissions()
  Result: Root delegation (50 USDC, 5 calls)

Step 2: REDELEGATE
  Master Agent → createDelegation(parentDelegation: rootHash)
  Result: 2 sub-delegations (Data Worker + Exec Worker)

Step 3: PAY via x402
  Data Worker → GET /api/premium-data/market-feed
  Server → 402 PAYMENT-REQUIRED
  Data Worker → createOpenDelegation() → PAYMENT-SIGNATURE header
  Server → 200 OK + data

Step 4: EXECUTE via 1Shot
  Exec Worker → relayer_getFeeData()
  Exec Worker → relayer_send7710Transaction()
  Exec Worker → relayer_getStatus() → CONFIRMED

Step 5: SETTLE
  Master Agent → redeemDelegations()
  Result: Chain settled, budget consumed: 10.02 of 50 USDC
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Dashboard** | Next.js (App Router) | 16 |
| **UI** | React | 19 |
| **Styling** | Tailwind CSS | v4 |
| **Agent Runtime** | Express | 5.x |
| **Smart Accounts** | @metamask/smart-accounts-kit | 1.5.x |
| **x402** | @x402/core, @x402/evm, @x402/express | latest |
| **Relay** | 1Shot Public Relayer | JSON-RPC |
| **Chain** | Ethereum Sepolia | ChainId: 11155111 |
| **Language** | TypeScript | 5.x (strict mode) |
| **Testing** | Jest + Supertest | latest |
| **Package Manager** | npm | 10.x |

---

## Project Structure

```
DelegAI/
├── src/
│   ├── app/                          # Next.js 16 App Router
│   │   ├── layout.tsx                # Root layout (fonts, metadata)
│   │   ├── page.tsx                  # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Main delegation dashboard
│   │   ├── api/
│   │   │   ├── sse/
│   │   │   │   └── route.ts          # Server-Sent Events endpoint
│   │   │   ├── delegation/
│   │   │   │   └── route.ts          # Delegation CRUD API
│   │   │   ├── agents/
│   │   │   │   └── route.ts          # Agent orchestration trigger
│   │   │   └── premium-data/
│   │   │       ├── market-feed/
│   │   │       │   └── route.ts      # x402-protected market data
│   │   │       └── defi-yields/
│   │   │           └── route.ts      # x402-protected yield data
│   │   └── globals.css               # Tailwind v4 + design tokens
│   ├── components/
│   │   ├── DelegationTree.tsx        # Animated delegation hierarchy
│   │   ├── AgentCard.tsx             # Agent status cards
│   │   ├── BudgetMeter.tsx           # Budget consumption bars
│   │   ├── ActivityFeed.tsx          # Live event log
│   │   ├── CaveatBadge.tsx           # Caveat type indicators
│   │   ├── StartDelegationButton.tsx # CTA with MetaMask interaction
│   │   └── Header.tsx               # Top navigation
│   ├── agents/
│   │   ├── orchestrator.ts           # Master Agent logic
│   │   ├── data-worker.ts            # x402 buyer agent
│   │   └── exec-worker.ts            # 1Shot executor agent
│   ├── lib/
│   │   ├── delegator.ts              # Smart account + delegation helpers
│   │   ├── relay.ts                  # 1Shot API client
│   │   ├── buyer.ts                  # x402 buyer flow
│   │   ├── seller.ts                 # x402 seller setup
│   │   ├── types.ts                  # Shared TypeScript types
│   │   ├── constants.ts              # Addresses, chain config, etc.
│   │   ├── mock-data.ts              # Demo mode fixtures
│   │   └── events.ts                 # SSE event emitter
│   └── __tests__/
│       ├── delegation.test.ts        # Delegation chain unit tests
│       ├── orchestrator.test.ts      # Agent orchestration tests
│       ├── x402.test.ts              # x402 buyer/seller tests
│       ├── relay.test.ts             # 1Shot relay tests
│       └── api.test.ts               # API route integration tests
├── scripts/
│   ├── seed-accounts.ts              # Generate deterministic accounts
│   ├── demo.ts                       # Run full demo flow
│   ├── bench.ts                      # Performance benchmarks
│   ├── verify-demo.ts                # Demo mode verification
│   └── check-submission.ts           # Submission readiness check
├── docs/
│   ├── DEMO_SCRIPT.md                # Step-by-step demo walkthrough
│   └── SDK_FEEDBACK.md               # MetaMask SDK feedback (Feedback track)
├── public/
│   ├── logo.svg                      # DelegAI logo
│   └── og.png                        # Open Graph image
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI pipeline
├── ARCHITECTURE.md                   # This file
├── AGENTS.md                         # Agent instructions for AI tools
├── README.md                         # Project README with test count
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── jest.config.ts
├── .env.example
├── .env.local                        # Local env (gitignored)
├── .gitignore
└── LICENSE
```

---

## Design System

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#06b6d4` (Cyan 500) | MetaMask/delegation accents |
| **Success** | `#22c55e` (Green 500) | Settled, confirmed states |
| **Warning** | `#f59e0b` (Amber 500) | Pending, processing |
| **Danger** | `#ef4444` (Red 500) | Errors, budget exceeded |
| **Info** | `#8b5cf6` (Violet 500) | Agent activity, delegation events |
| **Background** | `#0f172a` (Slate 900) | Dark mode base |
| **Surface** | `#1e293b` (Slate 800) | Card backgrounds |
| **Border** | `#334155` (Slate 700) | Subtle borders |
| **Text Primary** | `#f8fafc` (Slate 50) | Main text |
| **Text Secondary** | `#94a3b8` (Slate 400) | Muted text |

**Typography:**
- Headings: `Orbitron` (tech/SOC aesthetic)
- Body: `Inter` (readability)
- Data/Code: `JetBrains Mono` (monospace)

**Aesthetic:** Military SOC / Command Center — dark mode only, glassmorphism cards, subtle glow effects on active delegations.

---

## Demo Mode Architecture

```env
DELEGAI_DEMO=true
```

When enabled:
- **Delegator**: Returns pre-signed delegation fixtures (no MetaMask needed)
- **x402 Seller**: Accepts any PAYMENT-SIGNATURE header
- **1Shot Relay**: Returns mock success after 1s delay
- **Accounts**: Pre-funded deterministic addresses
- **SSE**: Emits scripted events at realistic intervals

This enables judges to run the full demo locally with `npm run dev` — no wallet, no testnet funds, no external dependencies.

---

## Security Model

```
User grants: 50 USDC, 5 calls, 24h expiry
  ↓
Master redelegates: ≤ 10 USDC, ≤ 2 calls per worker
  ↓
Workers execute: CONSTRAINED by parent caveats
  ↓
Invariant: Worker budget ≤ Master budget ≤ User budget (enforced on-chain)
```

**Key insight:** Each redelegation level NARROWS scope. The system gets SAFER as it grows.
