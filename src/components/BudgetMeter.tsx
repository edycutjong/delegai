interface BudgetMeterProps {
  allocated: number;
  consumed: number;
  label?: string;
}

export function BudgetMeter({ allocated, consumed, label }: BudgetMeterProps) {
  const percentage = allocated > 0 ? Math.min((consumed / allocated) * 100, 100) : 0;
  const remaining = allocated - consumed;

  const barColor =
    percentage > 80
      ? 'bg-danger'
      : percentage > 50
      ? 'bg-warning'
      : 'bg-success';

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-mono text-text-secondary">
          {consumed.toFixed(2)} / {allocated} USDC
        </span>
        {label && (
          <span className="text-text-muted">{label}</span>
        )}
      </div>
      <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full budget-meter-fill ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs mt-1">
        <span className="text-text-muted">
          {percentage.toFixed(1)}% used
        </span>
        <span className="text-text-muted font-mono">
          {remaining.toFixed(2)} remaining
        </span>
      </div>
    </div>
  );
}
