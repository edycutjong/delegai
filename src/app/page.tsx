import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Hero Section */}
      <div className="relative z-10 max-w-3xl mx-auto text-center animate-fade-in-up">
        {/* Logo / Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            MetaMask Smart Accounts Kit × 1Shot API
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-4">
            <span className="text-primary">Deleg</span>
            <span className="text-text-primary">AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
            AI agents that autonomously{" "}
            <span className="text-primary font-semibold">hire</span>,{" "}
            <span className="text-warning font-semibold">scope</span>, and{" "}
            <span className="text-success font-semibold">pay</span> sub-agents
            via MetaMask redelegation chains.
          </p>
        </div>

        {/* Delegation Chain Preview */}
        <div className="glass-card-glow p-6 mb-8 text-left max-w-md mx-auto">
          <p className="text-xs text-text-muted font-mono uppercase tracking-wider mb-3">
            Delegation Chain
          </p>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-primary">User</span>
              <span className="text-text-muted ml-auto">50 USDC · 5 calls</span>
            </div>
            <div className="ml-4 border-l-2 border-primary/30 pl-4 space-y-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-info" />
                <span className="text-info">Master Agent</span>
                <span className="text-text-muted ml-auto">redelegates ↓</span>
              </div>
              <div className="ml-4 border-l-2 border-info/30 pl-4 space-y-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                  <span className="text-warning">Data Worker</span>
                  <span className="text-text-muted ml-auto">10 USDC · x402</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success" />
                  <span className="text-success">Exec Worker</span>
                  <span className="text-text-muted ml-auto">10 USDC · 1Shot</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            id="start-delegation-cta"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-bg-base font-semibold text-lg hover:bg-primary-dim transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Start Delegation
          </Link>
          <a
            href="https://github.com/edycutjong/delegai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 transition-all duration-200"
          >
            View Source
          </a>
        </div>

        {/* SDK Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto">
          {[
            { label: "SDK APIs", value: "18", color: "text-primary" },
            { label: "Delegation Depth", value: "3", color: "text-info" },
            { label: "Tracks", value: "5/5", color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-3 text-center">
              <p className={`text-2xl font-bold font-display ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
