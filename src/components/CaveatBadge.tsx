import type { CaveatType } from '@/lib/types';

interface CaveatBadgeProps {
  type: CaveatType;
  value: string | number;
}

const CAVEAT_STYLES: Record<CaveatType, { bg: string; text: string; icon: string }> = {
  Erc20TransferAmount: {
    bg: 'bg-success/10',
    text: 'text-success',
    icon: '💰',
  },
  LimitedCalls: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    icon: '🔢',
  },
  Redeemer: {
    bg: 'bg-info/10',
    text: 'text-info',
    icon: '🔑',
  },
};

export function CaveatBadge({ type, value }: CaveatBadgeProps) {
  const style = CAVEAT_STYLES[type] || CAVEAT_STYLES.LimitedCalls;

  const displayValue =
    type === 'Erc20TransferAmount'
      ? `${(Number(value) / 1e6).toFixed(2)} USDC`
      : type === 'Redeemer'
      ? `${String(value).slice(0, 8)}...`
      : String(value);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-[family-name:var(--font-mono)] ${style.bg} ${style.text}`}
    >
      <span>{style.icon}</span>
      <span>{type.replace(/([A-Z])/g, ' $1').trim()}</span>
      <span className="opacity-70">({displayValue})</span>
    </span>
  );
}
