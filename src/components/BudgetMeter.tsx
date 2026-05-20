'use client';

interface BudgetMeterProps {
  allocated: number;
  consumed: number;
  label?: string;
}

export function BudgetMeter({ allocated, consumed, label }: BudgetMeterProps) {
  const percentage = allocated > 0 ? Math.min((consumed / allocated) * 100, 100) : 0;
  const remaining  = allocated - consumed;

  const barColor =
    percentage > 80 ? 'bg-danger' :
    percentage > 50 ? 'bg-warning' :
    'bg-success';

  const glowColor =
    percentage > 80 ? 'rgba(239, 68, 68, 0.6)' :
    percentage > 50 ? 'rgba(245, 158, 11, 0.6)' :
    'rgba(34, 197, 94, 0.5)';

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span
          key={consumed}
          className={`font-mono text-text-secondary ${consumed > 0 ? 'animate-num-pop' : ''}`}
        >
          {consumed.toFixed(2)} / {allocated} USDC
        </span>
        {label && <span className="text-text-muted">{label}</span>}
      </div>

      {/* Track */}
      <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full budget-meter-fill ${barColor}`}
          style={{
            width: `${percentage}%`,
            boxShadow: percentage > 0 ? `0 0 8px ${glowColor}` : 'none',
          }}
        />
        {/* Shimmer streak on the fill */}
        {percentage > 0 && percentage < 100 && (
          <div
            className="absolute top-0 h-full w-6 rounded-full pointer-events-none"
            style={{
              left: `calc(${percentage}% - 12px)`,
              background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
              filter: 'blur(2px)',
              transition: 'left 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs mt-1">
        <span className="text-text-muted">{percentage.toFixed(1)}% used</span>
        <span className="text-text-muted font-mono">{remaining.toFixed(2)} remaining</span>
      </div>
    </div>
  );
}
