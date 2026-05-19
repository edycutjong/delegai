import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center animate-fade-in-up">
        <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
          404 — Route Not Found
        </p>
        <h1 className="text-6xl md:text-8xl font-bold font-display text-text-primary mb-2">
          <span className="text-primary">0x</span>404
        </h1>
        <p className="text-text-secondary text-lg mb-8">
          This delegation path does not exist on-chain.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-mono text-sm hover:bg-primary/20 transition-all duration-200"
        >
          ← Return to root
        </Link>
      </div>
    </main>
  );
}
