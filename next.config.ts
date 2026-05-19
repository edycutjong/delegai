import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@metamask/smart-accounts-kit",
    "@metamask/delegation-core",
    "viem",
  ],
};

export default nextConfig;
