import { RotateCcw } from 'lucide-react';

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
      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
        isRunning
          ? 'bg-warning/20 text-warning border border-warning/30 cursor-wait'
          : isComplete
          ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
          : 'bg-primary text-bg-base hover:bg-primary-dim hover:shadow-lg hover:shadow-primary/20'
      }`}
    >
      {isRunning ? (
        <>
          <span className="w-4 h-4 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
          Running Demo…
        </>
      ) : isComplete ? (
        <><RotateCcw size={16} /> Replay Demo</>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          Start Delegation
        </>
      )}
    </button>
  );
}
