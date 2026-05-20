'use client';

import { RotateCcw, Zap } from 'lucide-react';

interface StartDelegationButtonProps {
  onClick: () => void;
  isRunning: boolean;
  isComplete: boolean;
}

export function StartDelegationButton({ onClick, isRunning, isComplete }: StartDelegationButtonProps) {
  return (
    <button
      id="start-delegation-btn"
      onClick={onClick}
      disabled={isRunning}
      className={`relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 overflow-hidden ${
        isRunning
          ? 'bg-warning/20 text-warning border border-warning/30 cursor-wait'
          : isComplete
          ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30 hover:scale-105'
          : 'bg-primary text-bg-base hover:bg-primary-dim hover:scale-105 hover:shadow-xl hover:shadow-primary/30 animate-button-breathe'
      }`}
    >
      {isRunning ? (
        <>
          {/* Multi-ring spinner */}
          <span className="relative w-4 h-4 shrink-0">
            <span className="absolute inset-0 rounded-full border-2 border-warning/20 border-t-warning animate-spin" />
            <span className="absolute inset-1 rounded-full border border-warning/20 border-b-warning animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
          </span>
          Running…
        </>
      ) : isComplete ? (
        <>
          <RotateCcw size={15} />
          Replay Demo
        </>
      ) : (
        <>
          <Zap size={15} className="shrink-0" />
          Start Delegation
          {/* Shimmer sweep */}
          <span
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
            }}
          />
        </>
      )}
    </button>
  );
}
