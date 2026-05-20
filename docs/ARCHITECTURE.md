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
│         │           ┌────────▼────────┐           │          │
│         │           │   Venice AI     │           │          │
│         │           │  llama-3.3-70b  │           │          │
│         │           │ Budget reasoning│           │          │
│         │           │ Data insights   │           │          │
│         │           │ Exec decisions  │           │          │
│         │           └────────┬────────┘           │          │
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
| `/api/events` | `SSE Route` | Server-Sent Events for live updates |
| `/api/delegate` | `Delegate Route` | Delegation CRUD API |
| `/api/relay/webhook` | `Relay Webhook` | 1Shot transaction status callbacks |

**Key UI Components:**
- `DelegationTree` — Animated hierarchical tree visualization
- `AgentCard` — Per-agent status (active/pending/consumed/settled)
- `BudgetMeter` — Real-time budget consumption bar per delegation level
- `ActivityFeed` — SSE-powered live event log
- `AddressBadge` — Truncated Ethereum address display with copy
- `CaveatBadge` — Visual caveat type indicators

### 2. Agent Runtime (Next.js API Routes)

| Module | File | Responsibility |
|---|---|---|
| **Orchestrator** | `src/agents/orchestrator.ts` | Creates delegation chain, dispatches to workers |
| **Data Worker** | `src/agents/data-worker.ts` | x402 buyer — fetches premium data |
| **Exec Worker** | `src/agents/exec-worker.ts` | 1Shot executor — gasless transactions |
| **Delegator** | `src/lib/delegator.ts` | Smart account creation + ERC-7715 permissions |
| **Relay** | `src/lib/relay.ts` | 1Shot API client (getFeeData, send, getStatus) |
| **Buyer** | `src/lib/buyer.ts` | x402 buyer flow (open delegation + payment header) |
| **Bundler** | `src/lib/bundler.ts` | ERC-7710 bundler client actions |
| **Venice** | `src/lib/venice.ts` | Venice AI client — private LLM inference for agent reasoning |

### 3. Venice AI Intelligence Layer

Each agent calls Venice AI (`llama-3.3-70b`) at a key decision point before taking action:

| Agent | Venice AI call | What it reasons about |
|---|---|---|
| **Orchestrator** | Before creating sub-delegations | Budget allocation — how to split 50 USDC across workers |
| **Data Worker** | After receiving market data | Interpret and summarize the premium data feed |
| **Exec Worker** | Before submitting to 1Shot relay | Whether to proceed with the relay submission |

**Graceful degradation:** If `VENICE_API_KEY` is missing, empty, or returns 402/429, agents fall back to pre-scripted reasoning strings — the delegation flow never breaks.

### 4. x402 Seller (Next.js Route Handlers)

| Route | Price | Data |
|---|---|---|
| `/api/premium-data/market-feed` | 0.01 USDC | ETH/USDC/WBTC prices |
| `/api/premium-data/defi-yields` | 0.01 USDC | Aave/Compound/Lido APYs |

Built with `@x402/core` + `@x402/evm` using `Erc7710ExactEvmScheme`.

---

## Data Flow — The ONE Core Flow

```
Step 1: GRANT PERMISSION
  User → MetaMask popup → requestExecutionPermissions()
  Result: Root delegation (50 USDC, 5 calls)

Step 2: REDELEGATE (with Venice AI reasoning)
  Master Agent → Venice AI: "How should I split 50 USDC across 2 workers?"
  Venice AI → "Allocate 10 USDC each, reserve buffer for fees"
  Master Agent → createDelegation(parentDelegation: rootHash)
  Result: 2 sub-delegations (Data Worker + Exec Worker)

Step 3: PAY via x402 (with Venice AI insight)
  Data Worker → GET /api/premium-data/market-feed
  Server → 402 PAYMENT-REQUIRED
  Data Worker → createOpenDelegation() → PAYMENT-SIGNATURE header
  Server → 200 OK + data
  Data Worker → Venice AI: "Interpret this market data"
  Venice AI → "ETH showing bullish momentum, USDC stable..."

Step 4: EXECUTE via 1Shot (with Venice AI decision)
  Exec Worker → Venice AI: "Should I proceed with relay submission?"
  Venice AI → "Confirmed — fee data valid, proceed"
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
| **Agent Runtime** | Next.js API Routes | — |
| **Smart Accounts** | @metamask/smart-accounts-kit | 1.5.x |
| **x402** | @x402/core, @x402/evm | latest |
| **Agent Intelligence** | Venice AI API (llama-3.3-70b) | OpenAI-compatible |
| **Relay** | 1Shot Public Relayer | REST API, OAuth2 |
| **Chain** | Ethereum Sepolia | ChainId: 11155111 |
| **Language** | TypeScript | 5.x (strict mode) |
| **Testing** | Jest | latest |
| **Package Manager** | npm | 10.x |

---

## Project Structure

```
DelegAI/
├── src/
│   ├── app/                          # Next.js 16 App Router
│   │   ├── layout.tsx                # Root layout (fonts, metadata)
│   │   ├── page.tsx                  # Landing page
│   │   ├── not-found.tsx             # Custom 404 page
│   │   ├── opengraph-image.png       # OG image (auto-detected)
│   │   ├── icon.svg                  # Favicon (auto-detected)
│   │   ├── apple-icon.png            # Apple touch icon
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Main delegation dashboard
│   │   ├── api/
│   │   │   ├── events/
│   │   │   │   └── route.ts          # Server-Sent Events endpoint
│   │   │   ├── delegate/
│   │   │   │   └── route.ts          # Delegation CRUD API
│   │   │   ├── relay/
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts      # 1Shot relay webhook
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
│   │   ├── AddressBadge.tsx          # Truncated address display
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
│   │   ├── bundler.ts                # ERC-7710 bundler client actions
│   │   ├── venice.ts                 # Venice AI client (callVenice, graceful fallback)
│   │   ├── types.ts                  # Shared TypeScript types
│   │   ├── constants.ts              # Addresses, chain config, etc.
│   │   ├── mock-data.ts              # Demo mode fixtures
│   │   └── events.ts                 # SSE event emitter
│   └── __tests__/
│       ├── delegator.test.ts         # Delegation chain unit tests
│       ├── orchestrator.test.ts      # Agent orchestration tests
│       ├── buyer.test.ts             # x402 buyer tests
│       ├── seller.test.ts            # x402 seller tests
│       ├── relay.test.ts             # 1Shot relay tests
│       ├── bundler.test.ts           # Bundler action tests
│       ├── venice.test.ts            # Venice AI client tests
│       ├── data-worker.test.ts       # Data worker agent tests
│       ├── exec-worker.test.ts       # Exec worker agent tests
│       ├── constants.test.ts         # Constants validation tests
│       ├── events.test.ts            # SSE event tests
│       ├── mock-data.test.ts         # Mock data fixture tests
│       └── types.test.ts             # Type guard tests
├── scripts/
│   ├── deploy-accounts.ts            # Generate deterministic accounts
│   ├── test-delegation.ts            # End-to-end delegation test
│   ├── bench.ts                      # Performance benchmarks
│   ├── verify-demo.ts                # Demo mode verification
│   └── check-submission.ts           # Submission readiness check
├── docs/
│   ├── ARCHITECTURE.md               # This file
│   ├── DEMO_SCRIPT.md                # Step-by-step demo walkthrough
│   ├── ONESHOT_SETUP.md              # 1Shot relay configuration guide
│   ├── SDK_FEEDBACK.md               # MetaMask SDK feedback (Feedback track)
│   └── assets/                       # Generated images & thumbnails
├── public/
│   ├── icon.svg                      # DelegAI logo
│   ├── icon-1shot.png                # 1Shot partner icon
│   ├── icon-hackquest.png            # HackQuest partner icon
│   └── pitch/                        # Pitch deck (HTML)
├── .github/
│   ├── workflows/
│   │   └── ci.yml                    # CI pipeline
│   └── dependabot.yml                # Dependency updates
├── AGENTS.md                         # Agent instructions for AI tools
├── README.md                         # Project README
├── package.json
├── tsconfig.json
├── next.config.ts
├── jest.config.js
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

## Venice AI Integration

Venice AI provides **private LLM inference** — no data retention, no surveillance. Every agent call is isolated and uncached.

```
Orchestrator (Master Agent)
    │
    ├── callVenice("How should I allocate 50 USDC across 2 workers?")
    │   Model: llama-3.3-70b
    │   Response: Budget reasoning → emitted to ActivityFeed as ai_reasoning event
    │
Data Worker
    │
    ├── callVenice("Interpret this market data: ETH $X, USDC $Y...")
    │   Response: Human-readable insight → logged in ActivityFeed
    │
Exec Worker
    │
    └── callVenice("Should I proceed with 1Shot relay submission?")
        Response: Go/no-go decision → logged before relay call
```

**Fallback behaviour:**

| Condition | Result |
|---|---|
| `DELEGAI_DEMO=true` | Returns pre-scripted string immediately, no API call |
| `VENICE_API_KEY` not set | Returns pre-scripted string, no API call |
| Venice returns 402 (no credits) | Returns pre-scripted string, delegation continues |
| Venice returns 429 (rate limited) | Returns pre-scripted string, delegation continues |
| Venice returns 5xx | Throws — treated as orchestration error |

**Key file:** `src/lib/venice.ts` — OpenAI-compatible client pointing to `https://api.venice.ai/api/v1`

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
