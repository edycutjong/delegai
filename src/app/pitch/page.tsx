'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────
 * DelegAI — Interactive Pitch Deck
 * Keyboard-navigable slide presentation matching SOC aesthetic
 * ───────────────────────────────────────────────────────── */

interface Slide {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

const SLIDES: Slide[] = [
  // ── Slide 1: Title ──
  {
    title: '',
    content: (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-mono mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          MetaMask × 1Shot × Venice AI — Dev Cook Off
        </div>
        <h1 className="text-6xl md:text-8xl font-bold font-display tracking-tight mb-6">
          <span className="text-primary">Deleg</span>
          <span className="text-text-primary">AI</span>
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-2xl">
          The first trustless <span className="text-primary font-semibold">machine-to-machine</span> delegation economy
        </p>
        <div className="flex items-center gap-6 mt-10 text-sm font-mono text-text-muted">
          <span>18 SDK APIs</span>
          <span className="w-1 h-1 rounded-full bg-text-muted" />
          <span>3-Level Hierarchy</span>
          <span className="w-1 h-1 rounded-full bg-text-muted" />
          <span>6/6 Tracks</span>
        </div>
      </div>
    ),
  },

  // ── Slide 2: Problem ──
  {
    title: '🔴 The Problem',
    subtitle: 'AI agents can\'t spend money safely',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '🔓', title: 'Shared Keys', desc: 'AI agents with full wallet access — one hallucination drains everything', color: 'text-danger' },
          { icon: '💸', title: 'No Budget Limits', desc: 'No on-chain enforcement of spending caps — trust-based only', color: 'text-warning' },
          { icon: '🔗', title: 'No Sub-Delegation', desc: 'Agents can\'t hire other agents with scoped, revocable permissions', color: 'text-info' },
        ].map((item) => (
          <div key={item.title} className="glass-card p-6">
            <p className="text-3xl mb-3">{item.icon}</p>
            <h3 className={`text-lg font-semibold ${item.color} mb-2`}>{item.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },

  // ── Slide 3: Solution ──
  {
    title: '🟢 The Solution',
    subtitle: 'Cryptographic spending hierarchy via ERC-7710',
    content: (
      <div className="glass-card-glow p-8 max-w-xl mx-auto">
        <div className="space-y-4 font-mono text-base">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-primary shrink-0" />
            <span className="text-primary font-semibold">User</span>
            <span className="text-text-muted ml-auto">50 USDC · 5 calls max</span>
          </div>
          <div className="ml-6 border-l-2 border-primary/30 pl-6 space-y-4 py-2">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-info shrink-0" />
              <span className="text-info font-semibold">Master Agent</span>
              <span className="text-text-muted ml-auto text-sm">redelegates ↓</span>
            </div>
            <div className="ml-6 border-l-2 border-info/30 pl-6 space-y-3 py-1">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-warning shrink-0" />
                <span className="text-warning">Data Worker</span>
                <span className="text-text-muted ml-auto text-sm">10 USDC · x402 payment</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-success shrink-0" />
                <span className="text-success">Exec Worker</span>
                <span className="text-text-muted ml-auto text-sm">10 USDC · on-chain relay</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-xs text-text-muted font-mono">Each level is enforced by <span className="text-primary">smart contract caveats</span> — not trust</p>
        </div>
      </div>
    ),
  },

  // ── Slide 4: How It Works ──
  {
    title: '⚡ How It Works',
    subtitle: '10-second end-to-end flow',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { step: '1', label: 'Grant', desc: 'User signs root delegation (50 USDC, 5 calls)', color: 'bg-primary', icon: '🔑' },
          { step: '2', label: 'Redelegate', desc: 'Master narrows scope to workers (10 USDC each)', color: 'bg-info', icon: '🔀' },
          { step: '3', label: 'Buy Data', desc: 'Data Worker pays via x402 micropayment', color: 'bg-warning', icon: '💰' },
          { step: '4', label: 'Execute', desc: 'Exec Worker sends gasless relay via 1Shot', color: 'bg-success', icon: '🚀' },
          { step: '5', label: 'Settle', desc: 'redeemDelegations — 1 atomic on-chain TX', color: 'bg-danger', icon: '✅' },
        ].map((s) => (
          <div key={s.step} className="glass-card p-4 text-center relative">
            <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center text-sm font-bold text-bg-base mx-auto mb-3`}>
              {s.step}
            </div>
            <p className="text-lg mb-1">{s.icon}</p>
            <h3 className="text-sm font-semibold text-text-primary mb-1">{s.label}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    ),
  },

  // ── Slide 5: SDK Integration Depth ──
  {
    title: '🔗 18 SDK Integration Points',
    subtitle: 'Deep integration, not surface-level',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'MetaMask Smart Accounts Kit',
            color: 'text-[#F6851B]',
            items: ['createDelegation()', 'signDelegation()', 'hashDelegation()', 'createCaveatBuilder()', 'encodeDelegations()', 'createOpenDelegation()', 'getSmartAccountsEnvironment()', 'toMetaMaskSmartAccount(7702)', 'ScopeType.Erc20TransferAmount', 'CaveatType.LimitedCalls'],
          },
          {
            title: 'ERC-7710 Extensions',
            color: 'text-info',
            items: ['erc7710BundlerActions()', 'erc7715ProviderActions()', 'Erc7710ExactEvmScheme', 'verifyTypedData (EIP-712)', 'decodeDelegations()'],
          },
          {
            title: 'Sponsor APIs',
            color: 'text-success',
            items: ['1Shot getFeeData()', '1Shot sendTransaction()', 'Venice AI callVenice()'],
          },
        ].map((group) => (
          <div key={group.title} className="glass-card p-5">
            <h3 className={`text-sm font-semibold ${group.color} mb-3 font-mono uppercase tracking-wider`}>{group.title}</h3>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                  <span className="text-success">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },

  // ── Slide 6: Track Alignment ──
  {
    title: '🏆 6/6 Tracks Targeted',
    subtitle: 'Maximum prize coverage: $13,500',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { track: 'Best A2A Coordination', prize: '$3,000', desc: '3-level redelegation with parentDelegation linking', color: 'border-primary/40', tag: 'text-primary' },
          { track: 'Best Agent', prize: '$3,000', desc: 'Autonomous fleet: orchestrator + data worker + exec worker', color: 'border-info/40', tag: 'text-info' },
          { track: 'Best x402 + ERC-7710', prize: '$3,000', desc: 'Full buyer AND seller with EIP-712 verification', color: 'border-warning/40', tag: 'text-warning' },
          { track: 'Best Venice AI', prize: '$3,000', desc: '3 real LLM reasoning calls across all agents', color: 'border-success/40', tag: 'text-success' },
          { track: 'Best 1Shot Relayer', prize: '$1,000', desc: 'OAuth2 → getFeeData → sendTransaction → polling', color: 'border-danger/40', tag: 'text-danger' },
          { track: 'SDK Feedback', prize: '$500', desc: '4 constructive feedback points with code examples', color: 'border-text-muted/40', tag: 'text-text-secondary' },
        ].map((t) => (
          <div key={t.track} className={`glass-card p-4 border-l-4 ${t.color} flex items-start gap-4`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-sm font-semibold ${t.tag}`}>{t.track}</h3>
                <span className="text-xs font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded">{t.prize}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },

  // ── Slide 7: Architecture ──
  {
    title: '🏗️ Architecture',
    subtitle: 'Production-grade tech stack',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-mono text-primary uppercase tracking-wider mb-4">Frontend</h3>
          <div className="space-y-3">
            {[
              { tech: 'Next.js 16', desc: 'App Router', icon: '▲' },
              { tech: 'React 19', desc: 'Server Components', icon: '⚛' },
              { tech: 'Tailwind v4', desc: 'Design System', icon: '🎨' },
              { tech: 'TypeScript', desc: 'Strict Mode', icon: '📘' },
            ].map((t) => (
              <div key={t.tech} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{t.icon}</span>
                <span className="text-text-primary font-semibold">{t.tech}</span>
                <span className="text-text-muted text-xs font-mono ml-auto">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-mono text-info uppercase tracking-wider mb-4">Backend / Chain</h3>
          <div className="space-y-3">
            {[
              { tech: 'Ethereum Sepolia', desc: 'Testnet', icon: '⟠' },
              { tech: 'MetaMask SDK', desc: 'Smart Accounts Kit 1.5.x', icon: '🦊' },
              { tech: '1Shot API', desc: 'Gasless Relay', icon: '⚡' },
              { tech: 'Venice AI', desc: 'llama-3.3-70b', icon: '🤖' },
            ].map((t) => (
              <div key={t.tech} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{t.icon}</span>
                <span className="text-text-primary font-semibold">{t.tech}</span>
                <span className="text-text-muted text-xs font-mono ml-auto">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5 md:col-span-2">
          <h3 className="text-sm font-mono text-success uppercase tracking-wider mb-4">Quality</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              { stat: '100%', label: 'Test Coverage' },
              { stat: '186', label: 'Tests' },
              { stat: '13', label: 'Test Suites' },
              { stat: '0', label: 'Lint Warnings' },
              { stat: 'MIT', label: 'License' },
              { stat: 'CI/CD', label: 'GitHub Actions' },
            ].map((s) => (
              <div key={s.label} className="text-center px-4">
                <p className="text-xl font-bold font-display text-primary">{s.stat}</p>
                <p className="text-xs text-text-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // ── Slide 8: Differentiators ──
  {
    title: '💎 Why DelegAI Wins',
    subtitle: 'What separates us from the field',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { title: 'Not a wrapper — a protocol', desc: 'Every SDK call is real. 18 integration points verified with 100% test coverage. No mocks in production.', icon: '🔧', color: 'text-primary' },
          { title: 'Real on-chain settlement', desc: 'Verifiable Sepolia TX. redeemDelegations executes atomically — entire chain validates or nothing happens.', icon: '⛓️', color: 'text-success' },
          { title: 'True M2M economy', desc: '3-level delegation hierarchy: User → Master → Workers. Each level has cryptographic spending limits.', icon: '🤖', color: 'text-info' },
          { title: 'Full buyer AND seller', desc: 'Most projects do one side. We implement both x402 buyer (createOpenDelegation) and seller (EIP-712 verification).', icon: '💰', color: 'text-warning' },
        ].map((d) => (
          <div key={d.title} className="glass-card-glow p-5">
            <div className="flex items-start gap-4">
              <span className="text-2xl shrink-0">{d.icon}</span>
              <div>
                <h3 className={`text-base font-semibold ${d.color} mb-1`}>{d.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{d.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },

  // ── Slide 9: CTA ──
  {
    title: '',
    content: (
      <div className="flex flex-col items-center justify-center text-center">
        <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-6">
          <span className="text-primary">Deleg</span>
          <span className="text-text-primary">AI</span>
        </h2>
        <p className="text-xl text-text-secondary mb-10 max-w-lg">
          The first trustless M2M delegation economy. <br />
          <span className="text-primary">18 SDK APIs. 3-level hierarchy. 1 atomic TX.</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-bg-base font-semibold text-lg hover:bg-primary-dim transition-all duration-200 hover:scale-105"
          >
            ⚡ Live Demo
          </Link>
          <a
            href="https://youtu.be/MeoZRcPIM1A"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-primary/50 text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105"
          >
            🎬 Pitch Video
          </a>
          <a
            href="https://github.com/edycutjong/delegai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 transition-all duration-200"
          >
            GitHub →
          </a>
        </div>
        <div className="flex items-center gap-6 text-sm font-mono text-text-muted">
          <span>Built by Edy Cu</span>
          <span className="w-1 h-1 rounded-full bg-text-muted" />
          <span>MIT License</span>
          <span className="w-1 h-1 rounded-full bg-text-muted" />
          <span>2026</span>
        </div>
      </div>
    ),
  },
];

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(() => 0);
  const [isAnimating, setIsAnimating] = useState(() => false);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index < 0 || index >= SLIDES.length) return;
      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 400);
    },
    [isAnimating]
  );

  const next = useCallback(() => goTo(currentSlide + 1), [goTo, currentSlide]);
  const prev = useCallback(() => goTo(currentSlide - 1), [goTo, currentSlide]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') { window.location.href = '/'; }
      // Number keys jump to slide
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= SLIDES.length) goTo(num - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, goTo]);

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-border/50">
        <Link href="/" className="text-sm font-mono text-text-muted hover:text-primary transition-colors">
          ← Back
        </Link>
        <span className="text-sm font-mono text-text-muted">
          <span className="text-primary">{currentSlide + 1}</span>
          <span className="text-text-muted/60"> / {SLIDES.length}</span>
        </span>
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-bg-surface text-[10px]">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-bg-surface text-[10px]">→</kbd>
          <span className="hidden sm:inline ml-1">navigate</span>
        </div>
      </header>

      {/* Slide content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-12 overflow-y-auto">
        <div
          key={currentSlide}
          className="w-full max-w-5xl animate-fade-in-up"
        >
          {slide.title && (
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-text-primary mb-2">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-base text-text-secondary font-mono">{slide.subtitle}</p>
              )}
            </div>
          )}
          {slide.content}
        </div>
      </main>

      {/* Bottom progress bar + nav */}
      <footer className="relative z-20 border-t border-border/50">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'w-8 bg-primary'
                  : i < currentSlide
                  ? 'w-3 bg-primary/40'
                  : 'w-3 bg-border'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </footer>

      {/* Click zones for navigation */}
      <button
        onClick={prev}
        className="fixed left-0 top-12 bottom-12 w-16 z-30 cursor-w-resize opacity-0 hover:opacity-100 transition-opacity"
        aria-label="Previous slide"
        disabled={currentSlide === 0}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-text-muted/40 text-2xl">‹</span>
        </div>
      </button>
      <button
        onClick={next}
        className="fixed right-0 top-12 bottom-12 w-16 z-30 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity"
        aria-label="Next slide"
        disabled={currentSlide === SLIDES.length - 1}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-text-muted/40 text-2xl">›</span>
        </div>
      </button>
    </div>
  );
}
