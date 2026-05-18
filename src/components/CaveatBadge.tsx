import type { CaveatType } from '@/lib/types';

interface CaveatBadgeProps {
  type: CaveatType;
  value: string | number;
}

import { Coins, Hash, Key } from 'lucide-react';

const CAVEAT_STYLES: Record<CaveatType, { bg: string; text: string; icon: React.ReactNode }> = {
  Erc20TransferAmount: {
    bg: 'bg-success/10',
    text: 'text-success',
    icon: <Coins size={12} />,
  },
  LimitedCalls: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    icon: <Hash size={12} />,
  },
  Redeemer: {
    bg: 'bg-info/10',
    text: 'text-info',
    icon: <Key size={12} />,
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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono ${style.bg} ${style.text}`}
    >
      <span>{style.icon}</span>
      <span>{type.replace(/([A-Z])/g, ' $1').trim()}</span>
      <span className="opacity-70">({displayValue})</span>
    </span>
  );
}
