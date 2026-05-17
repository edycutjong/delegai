# MetaMask Smart Accounts Kit — SDK Feedback

Thank you for building the Smart Accounts Kit! Building **DelegAI** pushed the limits of the redelegation primitives. Here is our constructive feedback based on integrating 10+ distinct API calls for our hackathon submission.

## 1. Redelegation Caveat Complexity
**The Experience:**
Creating sub-delegations (redelegations) required extremely precise caveating to ensure the `parentDelegation` hash matched the constraints of the child.
**The Feedback:**
It would be highly beneficial to have a `deriveCaveats(parent)` utility that automatically intersects or validates the child caveats against the parent's boundaries before attempting to encode the payload. This would save hours of debugging `InvalidCaveat` reverts.

## 2. x402 Express Middleware Types
**The Experience:**
Implementing the seller-side x402 middleware using `@x402/express` and `Erc7710ExactEvmScheme` was straightforward conceptually, but the TypeScript typings felt incomplete in a few edge cases when extracting the `PAYMENT-SIGNATURE`.
**The Feedback:**
Exporting stronger types for the parsed signature components and providing a built-in helper for validating the recovered signer directly inside the middleware (without needing custom ethers.js fallback logic) would make the developer experience much smoother.

## 3. Gas Pricing with 1Shot Relay
**The Experience:**
Using `relayer_getFeeData` and `relayer_send7710Transaction` worked beautifully for gasless execution. However, mapping the returned USDC fee quote directly into the `Erc20TransferAmount` caveat required some manual buffer logic to account for fluctuating gas prices during the signing window.
**The Feedback:**
A recommended pattern or utility for "slippage tolerance" within ERC-20 caveats specifically for relayer fees would be a great addition to the documentation.

## 4. Documentation Request: Delegation Trees
We built a visualization of the delegation chain (User → Master → Worker). The `hashDelegation()` method is essential for linking these, but the documentation could benefit from a dedicated "Hierarchical Delegation" tutorial that explicitly shows how to link a Level 3 agent back to a Level 1 user.

Overall, the toolkit is incredibly powerful and enabled us to build a true M2M economy that wouldn't have been possible on any other stack.
