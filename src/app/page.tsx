import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 pb-16">
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
            MetaMask Smart Accounts Kit × 1Shot API × Venice AI
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {/* Primary — Start Delegation */}
          <Link
            href="/dashboard"
            id="start-delegation-cta"
            className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-bg-base font-semibold text-lg overflow-hidden animate-button-breathe hover:bg-primary-dim transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Start Delegation
            {/* Shimmer sweep */}
            <span
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3s linear infinite",
              }}
            />
          </Link>

          {/* Secondary — Pitch Deck */}
          <Link
            href="/pitch"
            className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-primary/50 text-primary font-semibold text-lg overflow-hidden hover:bg-primary/10 hover:border-primary transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Pitch Deck
            {/* Shimmer sweep */}
            <span
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(6,182,212,0.12) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3.5s linear infinite",
              }}
            />
          </Link>

          {/* Tertiary — View Source */}
          <a
            href="https://github.com/edycutjong/delegai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            View Source
          </a>
        </div>

        {/* SDK Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-16">
          {[
            { label: "SDK APIs", value: "18", color: "text-primary" },
            { label: "Delegation Depth", value: "3", color: "text-info" },
            { label: "Tracks", value: "6/6", color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-3 text-center">
              <p className={`text-2xl font-bold font-display ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Sponsors */}
        <div className="border-t border-border/50 pt-10">
          <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-6">
            Built for
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* MetaMask — SVG fox (no PNG available) */}
            <div className="flex items-center gap-2.5 h-14 px-5 rounded-lg border border-border/60 bg-bg-surface/40 hover:border-[#F6851B]/40 hover:bg-[#F6851B]/5 transition-all duration-200">
              <svg viewBox="0 0 35 33" className="w-6 h-6 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.958 1L19.64 10.71l2.447-5.79L32.958 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.042 1l13.2 9.8-2.33-5.88L2.042 1z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M28.23 23.53l-3.545 5.43 7.586 2.09 2.175-7.4-6.216-.12zM.573 23.65l2.163 7.4 7.574-2.09-3.533-5.43-6.204.12z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.98 14.73l-2.115 3.195 7.527.344-.252-8.09-5.16 4.55zM25.02 14.73l-5.23-4.64-.172 8.18 7.516-.344-2.114-3.196zM10.31 28.96l4.52-2.19-3.9-3.04-.62 5.23zM20.17 26.77l4.508 2.19-.608-5.23-3.9 3.04z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M24.678 28.96l-4.508-2.19.362 2.94-.04 1.24 4.186-1.99zM10.31 28.96l4.198 1.99-.028-1.24.35-2.94-4.52 2.19z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14.574 21.87l-3.76-1.105 2.655-1.216 1.105 2.32zM20.426 21.87l1.105-2.32 2.667 1.216-3.772 1.105z" fill="#233447" stroke="#233447" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.31 28.96l.643-5.43-4.176.12 3.533 5.31zM24.047 23.53l.631 5.43 3.545-5.31-4.176-.12zM27.134 17.925l-7.516.344.697 3.6 1.105-2.32 2.667 1.216 3.047-2.84zM10.814 20.765l2.655-1.216 1.093 2.32.709-3.6-7.527-.344 3.07 2.84z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7.865 17.925l3.155 6.155-.104-3.315-3.051-2.84zM24.096 20.765l-.116 3.315 3.154-6.155-3.038 2.84zM15.394 18.269l-.709 3.6.886 4.573.2-6.026-.377-2.147zM19.606 18.269l-.365 2.135.188 6.038.886-4.573-.71-3.6z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.426 21.87l-.886 4.572.632.44 3.9-3.04.116-3.315-3.762 1.343zM10.814 20.765l.104 3.315 3.9 3.04.632-.44-.886-4.573-3.75-1.342z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.508 30.95l.04-1.24-.338-.292h-4.992l-.326.292.028 1.24-4.198-1.99 1.467 1.2 2.975 2.063h5.1l2.986-2.063 1.455-1.2-4.197 1.99z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.17 26.77l-.632-.44h-3.076l-.632.44-.35 2.94.326-.292h4.992l.338.292-.966-2.94z" fill="#161616" stroke="#161616" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M33.516 11.3l1.117-5.4-1.675-4.9-12.788 9.5 4.923 4.16 6.964 2.034 1.537-1.793-.666-.48 1.06-.967-.817-.632 1.06-.808-.715-.713zM.367 5.9l1.117 5.4-.726.713 1.072.808-.806.632 1.06.967-.667.48 1.526 1.793 6.964-2.034 4.923-4.16L1.042 1l-.675 4.9z" fill="#763E1A" stroke="#763E1A" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M32.057 16.294l-6.964-2.034 2.114 3.195-3.155 6.155 4.164-.052h6.216l-2.375-7.264zM9.98 14.26l-6.964 2.034-2.34 7.264h6.204l4.152.052-3.143-6.155 2.09-3.195zM19.606 18.27l.44-7.56 2.01-5.44h-8.952l1.986 5.44.465 7.56.176 2.16.012 5.99h3.076l.024-5.99.163-2.16z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-semibold text-text-primary">MetaMask</span>
              <span className="text-xs text-text-muted font-mono">Smart Accounts Kit</span>
            </div>

            {/* 1Shot API — real PNG wordmark */}
            <div className="flex items-center gap-2.5 h-14 px-5 rounded-lg border border-border/60 bg-bg-surface/40 hover:border-[#1ab8c8]/40 hover:bg-[#1ab8c8]/5 transition-all duration-200">
              <Image
                src="/icon-1shot.png"
                alt="1Shot API"
                width={64}
                height={24}
                className="h-5 w-auto object-contain shrink-0"
              />
              <span className="text-xs text-text-muted font-mono">Public Relayer</span>
            </div>

            {/* Venice AI — inline SVG wordmark */}
            <div className="flex items-center gap-2.5 h-14 px-5 rounded-lg border border-border/60 bg-bg-surface/40 hover:border-[#0891b2]/40 hover:bg-[#0891b2]/5 transition-all duration-200">
              <svg width="79" height="89" viewBox="0 0 79 89" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 shrink-0 text-[#0891b2]">
                <path fillRule="evenodd" clipRule="evenodd" d="M25.5614 59.6096C24.1058 58.5274 22.3489 57.6207 20.4061 57.0699C18.4633 56.5191 16.3346 56.3243 14.2531 56.5552C12.1716 56.7861 10.1374 57.4427 8.36251 58.4059C6.58769 59.369 5.07223 60.6388 3.88911 62.0137C2.70275 63.3858 1.66918 65.0712 0.976934 66.9682C0.284683 68.8652 -0.066254 70.9738 0.0108757 73.0666C0.0879638 75.1594 0.59312 77.2365 1.42305 79.0774C2.25301 80.9183 3.40779 82.5231 4.69195 83.8042C5.97303 85.0883 7.57779 86.2431 9.4187 87.0731C11.2596 87.903 13.3367 88.4081 15.4295 88.4852C17.5223 88.5624 19.6309 88.2114 21.5279 87.5192C23.4249 86.8269 25.1103 85.7934 26.4824 84.607C27.8573 83.4239 29.1271 81.9084 30.0903 80.1336C31.0534 78.3587 31.71 76.3245 31.9409 74.243C32.1718 72.1615 31.977 70.0328 31.4262 68.09C30.8755 66.1472 29.9687 64.3904 28.8865 62.9347L32.4611 59.3601L35.063 61.962H36.5408L38.3244 60.1784V58.7006L35.7225 56.0987L39.5 52.3212L43.2775 56.0987L40.6756 58.7006V60.1784L42.4592 61.962H43.937L46.5389 59.3601L50.1135 62.9347C49.0313 64.3904 48.1245 66.1472 47.5738 68.09C47.023 70.0328 46.8282 72.1615 47.0591 74.243C47.29 76.3245 47.9466 78.3587 48.9097 80.1336C49.8729 81.9084 51.1427 83.4239 52.5176 84.607C53.8897 85.7934 55.5751 86.8269 57.4721 87.5192C59.3691 88.2114 61.4777 88.5624 63.5705 88.4852C65.6633 88.4081 67.7403 87.903 69.5813 87.0731C71.4222 86.2431 73.027 85.0883 74.308 83.8042C75.5922 82.5231 76.747 80.9183 77.5769 79.0774C78.4069 77.2365 78.912 75.1594 78.9891 73.0666C79.0663 70.9738 78.7153 68.8652 78.0231 66.9682C77.3308 65.0712 76.2972 63.3858 75.1109 62.0137C73.9278 60.6388 72.4123 59.369 70.6374 58.4059C68.8626 57.4427 66.8284 56.7861 64.7469 56.5552C62.6654 56.3243 60.5367 56.5191 58.5939 57.0699C56.6511 57.6207 54.8942 58.5274 53.4386 59.6096L49.9305 56.0959L52.531 53.4954V52.0176L50.6837 50.1703H49.2059L46.604 52.7722L42.8251 48.9961L62.6362 29.185L70.6558 37.2045V28.8603H79L70.9804 20.8408L79 12.8212V11.3434L77.1527 9.49612H75.6749L39.5 45.671L3.32508 9.49612H1.84728L0 11.3434V12.8212L8.01957 20.8408L0 28.8603H8.34422V37.2045L16.3637 29.185L36.1749 48.9961L32.396 52.7722L29.7941 50.1703H28.3163L26.469 52.0176V53.4954L29.0695 56.0959L25.5614 59.6096ZM57.7097 77.9616C56.894 79.6349 57.0634 81.9536 58.1137 83.4906C59.0787 85.0824 61.1198 86.1956 62.9806 86.1449C64.8415 86.1956 66.8826 85.0824 67.8476 83.4906C68.8979 81.9536 69.0674 79.6349 68.2516 77.9616L68.4548 77.7428C70.1279 78.5629 72.4501 78.3968 73.9895 77.3469C75.584 76.3828 76.6997 74.3394 76.6488 72.4767C76.6997 70.6141 75.584 68.5708 73.9895 67.6066C72.4501 66.5567 70.1279 66.3906 68.4548 67.2107L68.2516 66.992C69.0674 65.3187 68.8979 62.9999 67.8476 61.463C66.8826 59.8711 64.8415 58.7579 62.9806 58.8087C61.1198 58.7579 59.0787 59.8711 58.1137 61.463C57.0634 62.9999 56.894 65.3187 57.7097 66.992L57.5066 67.2107C55.8334 66.3906 53.5112 66.5567 51.9718 67.6066C50.3773 68.5708 49.2616 70.6141 49.3126 72.4767C49.2616 74.3394 50.3773 76.3828 51.9718 77.3469C53.5112 78.3968 55.8334 78.5629 57.5066 77.7428L57.7097 77.9616ZM20.8855 83.4906C21.9358 81.9536 22.1052 79.6349 21.2895 77.9616L21.4927 77.7428C23.1658 78.5629 25.488 78.3968 27.0274 77.3469C28.6219 76.3828 29.7376 74.3394 29.6867 72.4767C29.7376 70.6141 28.6219 68.5708 27.0274 67.6066C25.488 66.5567 23.1658 66.3906 21.4927 67.2107L21.2895 66.992C22.1052 65.3187 21.9358 62.9999 20.8855 61.463C19.9205 59.8711 17.8794 58.7579 16.0185 58.8087C14.1577 58.7579 12.1166 59.8711 11.1516 61.463C10.1013 62.9999 9.93188 65.3187 10.7476 66.992L10.5445 67.2107C8.87131 66.3906 6.54913 66.5567 5.00974 67.6066C3.41523 68.5708 2.29949 70.6141 2.35045 72.4767C2.29949 74.3394 3.41523 76.3828 5.00974 77.3469C6.54913 78.3968 8.87131 78.5629 10.5445 77.7428L10.7476 77.9616C9.93188 79.6349 10.1013 81.9536 11.1516 83.4906C12.1166 85.0824 14.1577 86.1956 16.0185 86.1449C17.8794 86.1956 19.9205 85.0824 20.8855 83.4906Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M39.4736 9.49609L48.9698 0L53.6721 4.70237V20.5533L40.6492 33.5761H38.2981L25.2751 20.5533V4.70237L29.9775 0L39.4736 9.49609ZM29.9776 3.32509L38.2981 11.6456V26.926L29.9776 18.6055V3.32509ZM40.6496 11.6456L48.9702 3.32509V18.6055L40.6496 26.926V11.6456Z" fill="currentColor"/>
              </svg>
              <span className="text-sm font-semibold text-text-primary">Venice AI</span>
              <span className="text-xs text-text-muted font-mono">Private Inference</span>
            </div>

            {/* HackQuest — PNG already has transparent background */}
            <div className="flex items-center gap-2.5 h-14 px-5 rounded-lg border border-border/60 bg-bg-surface/40 hover:border-[#F6E83C]/30 hover:bg-[#F6E83C]/5 transition-all duration-200">
              <Image
                src="/icon-hackquest.png"
                alt="HackQuest"
                width={24}
                height={24}
                className="w-6 h-6 object-contain shrink-0"
              />
              <span className="text-sm font-semibold text-text-primary">HackQuest</span>
              <span className="text-xs text-text-muted font-mono">Dev Cook Off</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
