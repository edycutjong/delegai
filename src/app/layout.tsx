import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DelegAI — Autonomous Agent Delegation Network",
  description:
    "AI agents autonomously hire, scope, and pay sub-agents via MetaMask redelegation chains and x402 micropayments. The first trustless M2M delegation economy.",
  keywords: [
    "MetaMask",
    "Smart Accounts",
    "ERC-7710",
    "ERC-7715",
    "x402",
    "1Shot",
    "AI Agents",
    "Delegation",
    "Web3",
  ],
  openGraph: {
    title: "DelegAI — Autonomous Agent Delegation Network",
    description:
      "AI agents autonomously hire, scope, and pay sub-agents via MetaMask redelegation chains and x402 micropayments.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col scanline-overlay">
        {children}
      </body>
    </html>
  );
}
