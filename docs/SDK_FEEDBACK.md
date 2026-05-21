# MetaMask Smart Accounts Kit — SDK Feedback

Thank you for building the Smart Accounts Kit! Building **DelegAI** pushed the limits of the redelegation primitives. Here is our constructive feedback based on integrating 18 distinct API calls for our hackathon submission.

## 1. Redelegation Caveat Complexity

**The Experience:**
Creating sub-delegations (redelegations) required extremely precise caveating to ensure the `parentDelegation` hash matched the constraints of the child. Mismatched types between `createCaveatBuilder()` output and `createDelegation()` input required multiple `as any` casts.

**The Feedback:**
It would be highly beneficial to have a `deriveCaveats(parent)` utility that automatically intersects or validates the child caveats against the parent's boundaries before attempting to encode the payload. This would save hours of debugging `InvalidCaveat` reverts.

**Code Example:**
```typescript
// Current: manual caveat construction with type casts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
caveatBuilder.addCaveat(CaveatType.Erc20TransferAmount as any, {
  tokenAddress: USDC_ADDRESS,
  maxAmount: BigInt(c.value as string),
});

// Proposed: derived caveats from parent
const childCaveats = deriveCaveats(parentDelegation, {
  narrowScope: { maxAmount: BigInt('10000000') },
});
```

## 2. x402 Express Middleware Types

**The Experience:**
Implementing the seller-side x402 middleware using `@x402/express` and `Erc7710ExactEvmScheme` was straightforward conceptually, but the TypeScript typings felt incomplete. The `PaymentRequirements`, `Price`, and `Network` types required manual imports from `@x402/core/types`, and the `ExactEvmScheme.parsePrice()` override signature didn't match the base class cleanly.

**The Feedback:**
Exporting stronger types for the parsed signature components and providing a built-in helper for validating the recovered signer directly inside the middleware (without needing custom `verifyTypedData` fallback logic from viem) would make the developer experience much smoother.

## 3. Gas Pricing with 1Shot Relay

**The Experience:**
Using `relayer_getFeeData` and `relayer_send7710Transaction` worked beautifully for gasless execution. However, mapping the returned USDC fee quote directly into the `Erc20TransferAmount` caveat required some manual buffer logic to account for fluctuating gas prices during the signing window.

**The Feedback:**
A recommended pattern or utility for "slippage tolerance" within ERC-20 caveats specifically for relayer fees would be a great addition to the documentation. Something like:

```typescript
// Proposed: slippage-aware caveat
const feeCaveat = createSlippageCaveat({
  baseAmount: feeData.feeAmount,
  slippagePercent: 5,
  tokenAddress: USDC_ADDRESS,
});
```

## 4. Documentation Request: Delegation Trees

We built a visualization of the delegation chain (User → Master → Worker). The `hashDelegation()` method is essential for linking these, but the documentation could benefit from a dedicated **"Hierarchical Delegation" tutorial** that explicitly shows how to link a Level 3 agent back to a Level 1 user.

**Specific gap:** The relationship between `authority` field on a child delegation and the hash of the parent is implicit. An explicit diagram in the docs showing `child.authority = hashDelegation(parent)` would prevent the ~2 hours we spent debugging chain resolution.

## 5. EIP-7702 Authorization Flow

**The Experience:**
`toMetaMaskSmartAccount(Implementation.Stateless7702)` is a powerful primitive — the EOA becomes the smart account without deploying a contract. However, the flow for signing EIP-7702 authorization tuples alongside delegation signatures wasn't documented. We had to separately import `signAuthorization` from `viem/accounts` and manually construct the auth tuple.

**The Feedback:**
A unified `createDelegationWithAuthorization()` helper that bundles the 7702 auth signing with the delegation signing would reduce integration complexity. Currently we need:
1. `toMetaMaskSmartAccount(Stateless7702)` — create the account
2. `signAuthorization()` from viem — sign the auth tuple
3. `signDelegation()` — sign the delegation itself
4. Manual combination for the relay call

A single helper combining steps 2-4 would be ideal.

## 6. `createOpenDelegation()` for x402 Buyer

**The Experience:**
The `createOpenDelegation()` method (delegate = anyone) is perfect for x402 buyer flows where the payment recipient isn't known at signing time. However, the return type doesn't include `signature` (it's unsigned by design), which means the subsequent `signDelegation()` call requires casting.

**The Feedback:**
Consider adding a `createAndSignOpenDelegation()` convenience method that combines creation + signing in one call, since open delegations always need signing before they can be encoded as payment headers.

## 7. `encodeDelegations()` Chain Ordering

**The Experience:**
The `encodeDelegations()` function requires delegations in `[leaf, ..., root]` order (leaf first), but the `createDelegation()` function returns them in the natural creation order (root first). We spent significant debugging time realizing the chain was reversed.

**The Feedback:**
Either:
- (a) Accept delegations in any order and sort internally, or
- (b) Add a prominent callout in the JSDoc: "Delegations MUST be ordered leaf-first. The first delegation's `delegate` must be `msg.sender`."

## 8. `createCaveatBuilder()` Type Safety

**The Experience:**
The `createCaveatBuilder(env)` returns a builder where `addCaveat()` accepts `CaveatType` enum values, but the type signatures required `as any` casts for all three caveat types we used (`Erc20TransferAmount`, `LimitedCalls`, `Redeemer`).

**The Feedback:**
This appears to be a TypeScript generics issue — the caveat builder's type parameter doesn't propagate the specific caveat data shapes. Fixing this would eliminate the 6 `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments in our codebase, all in `delegator.ts`.

---

Overall, the toolkit is incredibly powerful and enabled us to build a true M2M economy that wouldn't have been possible on any other stack. The 3-level delegation chain — User → Master → Workers — with scope-narrowing caveats at each level is a genuinely novel architecture pattern that the SDK made possible.
