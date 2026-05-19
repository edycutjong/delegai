# 1Shot Relay Setup Guide

This guide walks through configuring the [1Shot API](https://1shotapi.com) relay for gasless transaction submission in DelegAI.

Without this setup, the exec-worker degrades gracefully — delegations are still recorded but no on-chain transaction is submitted.

---

## Prerequisites

- A [1Shot account](https://app.1shotapi.com)
- DelegAI running in live mode (`DELEGAI_DEMO=false` or env vars unset)

---

## Step 1 — Create API Credentials

1. Go to **API Keys** in the 1Shot sidebar
2. Click **Create** and name it (e.g. `DelegAI`)
3. Copy the **Key** and **Secret**
4. Add to `.env.local`:

```env
ONESHOT_API_KEY=your-key-here
ONESHOT_API_SECRET=your-secret-here
```

---

## Step 2 — Create a Wallet

1Shot needs a funded wallet to pay gas on your behalf.

1. Go to **Wallets** in the sidebar
2. Click **Create a New Wallet**
3. Set:
   - **Blockchain**: Sepolia
   - Name it anything (e.g. `DelegAI Sepolia`)
4. Fund the wallet with Sepolia ETH (use a faucet)

---

## Step 3 — Import the DelegationManager Contract

1. Go to **Smart Contracts → My Smart Contracts**
2. Click **Import Smart Contract Methods**
3. Enter:
   - **Contract Address**: `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3`
   - **Blockchain**: Sepolia
4. The ABI will be auto-verified via Routescan — click **Proceed**

> This is the MetaMask DelegationManager contract — the canonical ERC-7710 delegation settlement contract on Sepolia.

---

## Step 4 — Register `redeemDelegations` as a Contract Method

1. Click **Details** on the `0xdb9B...7dB3` contract
2. Go to the **Write Functions** tab
3. Click **`redeemDelegations(bytes[],bytes32[],bytes[])`**
4. Click **+ Add To My Contract Methods**
5. Leave webhook URL blank (DelegAI polls status instead)
6. Save

> Do **not** use the Events tab — that is for log listeners only.

---

## Step 5 — Get the Contract Method UUID

1. Go to **Smart Contracts → My Smart Contracts**
2. Click **Details** on the contract
3. In the **Write Functions** tab, click `redeemDelegations`
4. Copy the **Method ID** (UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
5. Add to `.env.local`:

```env
ONESHOT_CONTRACT_METHOD_ID=your-method-uuid-here
```

---

## Final `.env.local` (1Shot section)

```env
ONESHOT_API_KEY=your-api-key
ONESHOT_API_SECRET=your-api-secret
ONESHOT_CONTRACT_METHOD_ID=your-method-uuid
```

---

## How It Works

| Step | API Call | Description |
|------|----------|-------------|
| Fee quote | `GET /chains/11155111/fees` | Gets current Sepolia gas price |
| Submit tx | `POST /methods/{id}/executeAsDelegator` | Submits `redeemDelegations` gaslessly |
| Poll status | `GET /transactions/{taskId}` | Waits for `Completed` / `Failed` |

Auth uses **OAuth2 client credentials** — the SDK handles token refresh automatically (tokens cached until 60s before expiry).

---

## Graceful Degradation

If `ONESHOT_API_KEY` / `ONESHOT_API_SECRET` are missing, the exec-worker logs:

```
1Shot relay skipped — set ONESHOT_API_KEY to your registered relayer URL
Delegation chain settled (relay unconfigured — register at https://1shotapi.com)
```

If `ONESHOT_CONTRACT_METHOD_ID` is missing, fee data still works but transaction submission returns `no-method-configured` and resolves as `CONFIRMED` immediately.
