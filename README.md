# 🤖 DelegAI — Autonomous Agent Delegation Network

> AI agents that autonomously hire, scope, and pay sub-agents via MetaMask redelegation chains and x402 micropayments. The first trustless M2M delegation economy.

[![CI](https://github.com/edycutjong/delegai/actions/workflows/ci.yml/badge.svg)](https://github.com/edycutjong/delegai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)

## 🎯 The Problem

AI agents need to spend money — buying compute, fetching premium data, executing transactions. But trust is binary: grant full wallet access (one bug drains everything) or no access at all (the agent can't act). **There is no middle ground.**

## 💡 The Solution

DelegAI demonstrates a **3-level delegation chain** where each level is cryptographically constrained:

```
User (50 USDC, 5 calls max)
  └── Master Agent (redelegates narrower scope)
      ├── Data Worker (10 USDC, 2 calls) → x402 micropayments
      └── Exec Worker (10 USDC, 2 calls) → 1Shot gasless relay
```

Each redelegation level **NARROWS** scope. The system gets **SAFER** as it grows.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Dashboard | Next.js 16, React 19 |
| Styling | Tailwind CSS v4 |
| Smart Accounts | MetaMask Smart Accounts Kit (18 APIs) |
| Payments | x402 (buyer + seller) |
| Relay | 1Shot Public Relayer |
| Chain | Ethereum Sepolia |

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/edycutjong/delegai.git
cd delegai

# Install
npm install

# Run (demo mode)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click **Start Delegation** to see the full flow.

## 📁 Project Structure

```
src/
├── app/                    # Next.js 16 App Router
│   ├── page.tsx            # Landing page
│   ├── dashboard/page.tsx  # Main delegation dashboard
│   └── globals.css         # Design system
├── components/             # React 19 components
│   ├── DelegationTree.tsx  # Hierarchical chain visualization
│   ├── AgentCard.tsx       # Agent status cards
│   ├── BudgetMeter.tsx     # Budget consumption bars
│   └── ActivityFeed.tsx    # Live event log
├── agents/                 # Agent logic
│   ├── orchestrator.ts     # Master Agent
│   ├── data-worker.ts      # x402 buyer
│   └── exec-worker.ts      # 1Shot executor
└── lib/                    # Shared utilities
    ├── delegator.ts        # Smart account + delegation
    ├── relay.ts            # 1Shot API client
    ├── buyer.ts            # x402 buyer flow
    └── seller.ts           # x402 seller setup
```

## 🏆 Hackathon Tracks

| Track | Eligible | Key Feature |
|---|---|---|
| **Best A2A Coordination** | ✅ Primary | 3-level redelegation chain |
| **Best Agent** | ✅ | Autonomous agent fleet |
| **Best x402 + ERC-7710** | ✅ | Buyer + Seller implementation |
| **Social Media** | ✅ | @MetaMaskDev posts |
| **Feedback** | ✅ | SDK feedback doc |

## 📄 License

MIT © 2026 Edy Cu
