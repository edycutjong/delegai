import Link from 'next/link';
import type { DemoStep } from '@/lib/types';

interface HeaderProps {
  step: DemoStep;
  stepLabel: string;
}

export function Header({ step: _step, stepLabel }: HeaderProps) {
  return (
    <header className="border-b border-border bg-bg-surface/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-bold text-sm font-[family-name:var(--font-display)]">D</span>
          </div>
          <span className="font-[family-name:var(--font-display)] text-lg font-bold">
            <span className="text-primary">Deleg</span>
            <span className="text-text-primary">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-xs font-[family-name:var(--font-mono)] text-text-muted hidden sm:inline">
            {stepLabel}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-base border border-border text-xs font-[family-name:var(--font-mono)]">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-text-secondary">Sepolia</span>
          </div>
        </div>
      </div>
    </header>
  );
}
