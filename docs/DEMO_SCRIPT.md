# DelegAI — Demo Video Script

**Target Length:** 2.5 – 3 minutes
**Tone:** Technical, commanding, fast-paced (SOC aesthetic)

---

### 0:00–0:20 — The Problem
*(Screen: Visual of an AI agent diagram with a giant red 'wallet drained' warning.)*
"AI agents are becoming autonomous economic actors. They need to buy compute, fetch premium data, and call APIs. But right now, trust is binary — you either give an agent full access to your wallet, or nothing at all. One bug, one prompt injection, and your balance is gone."

### 0:20–0:50 — The One Permission Solution
*(Screen: MetaMask wallet popup -> DelegAI Dashboard showing the root delegation.)*
"DelegAI fixes this using the MetaMask Smart Accounts Kit. Here, I sign exactly ONE permission as the user: granting my Master Agent a limit of 50 USDC and 5 calls. That's the Root Delegation."

### 0:50–1:20 — Redelegation Chain
*(Screen: Dashboard delegation tree animating from Master to Worker agents.)*
"Now the magic happens. The Master Agent autonomously creates two sub-delegations: a Data Worker with 10 USDC for 2 calls, and an Exec Worker with 10 USDC for 2 calls. These are cryptographically constrained budgets. The workers physically cannot exceed these caveats."

### 1:20–1:50 — Autonomous x402 Payment
*(Screen: Terminal split screen showing the Data Worker hitting the API.)*
"Watch the Data Worker hit a premium x402 endpoint. It receives a 402 Payment Required challenge, constructs the `PAYMENT-SIGNATURE` header using its restricted delegation, and the Express middleware accepts it. The data is unlocked."

### 1:50–2:10 — 1Shot Relay Execution
*(Screen: Terminal showing Exec Worker submitting a transaction via 1Shot Relay.)*
"Meanwhile, the Exec Worker needs to perform an on-chain action. It packages a UserOp and sends it through the 1Shot Public Relayer, paying the gas fee in USDC using its delegated allowance."

### 2:10–2:30 — Settlement & Validation
*(Screen: UI updating with the settled chain and consumed budget.)*
"Both chains settle perfectly. We check the budget meter: exactly 10.02 USDC of the 50 USDC limit was consumed. The workers completed their tasks without ever having direct access to my keys."

### 2:30–2:50 — Close
*(Screen: Full DelegAI logo with track badges.)*
"DelegAI is the first M2M delegation economy — AI agents that can safely hire, scope, and pay each other. Thank you to MetaMask and 1Shot for making this possible."
