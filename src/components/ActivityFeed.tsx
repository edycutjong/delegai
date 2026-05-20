'use client';

import { useRef, useState, useEffect } from 'react';
import type { ActivityEvent } from '@/lib/types';
import {
  Link2, PenLine, CornerDownRight, CreditCard,
  BarChart2, Rocket, CheckCircle2, Flag, XCircle, ExternalLink, Brain,
} from 'lucide-react';
import { BLOCK_EXPLORER } from '@/lib/constants';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

const TYPE_STYLES: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  delegation_created:    { icon: <Link2 size={15} />,         color: 'text-primary',  bg: 'bg-primary/10' },
  delegation_signed:     { icon: <PenLine size={15} />,       color: 'text-primary',  bg: 'bg-primary/10' },
  sub_delegation_created:{ icon: <CornerDownRight size={15} />, color: 'text-info',   bg: 'bg-info/10' },
  x402_payment_sent:     { icon: <CreditCard size={15} />,    color: 'text-warning',  bg: 'bg-warning/10' },
  x402_data_received:    { icon: <BarChart2 size={15} />,     color: 'text-success',  bg: 'bg-success/10' },
  relay_submitted:       { icon: <Rocket size={15} />,        color: 'text-warning',  bg: 'bg-warning/10' },
  relay_confirmed:       { icon: <CheckCircle2 size={15} />,  color: 'text-success',  bg: 'bg-success/10' },
  chain_settled:         { icon: <Flag size={15} />,          color: 'text-primary',  bg: 'bg-primary/10' },
  ai_reasoning:          { icon: <Brain size={15} />,         color: 'text-info',     bg: 'bg-info/10' },
  error:                 { icon: <XCircle size={15} />,       color: 'text-danger',   bg: 'bg-danger/10' },
};

// Each row is always "new" on mount — key={event.id} ensures one mount per activity.
// highlighted persists for 1.5s so icon-bounce, row glow, and NEW pill all stay
// in sync regardless of how quickly subsequent items are added.
function ActivityRow({ event, index }: { event: ActivityEvent; index: number }) {
  const style = TYPE_STYLES[event.type] ?? TYPE_STYLES.error;
  const [highlighted, setHighlighted] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setHighlighted(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors duration-300 ${
        highlighted ? 'animate-row-highlight' : 'hover:bg-bg-elevated/25'
      } animate-slide-in-right`}
      style={{ animationDelay: `${Math.min(index, 2) * 30}ms` }}
    >
      {/* Icon bubble — always bounces in on mount */}
      <div
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${style.color} ${style.bg} animate-icon-bounce`}
      >
        {style.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${style.color}`}>{event.message}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-text-muted font-mono">
            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-text-muted opacity-40">·</span>
          <span className="text-xs text-text-muted font-mono">{event.agent}</span>
          {typeof event.metadata?.txHash === 'string' && (
            <>
              <span className="text-text-muted opacity-40">·</span>
              <a
                href={`${BLOCK_EXPLORER}/tx/${event.metadata.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 transition-colors"
              >
                view on Etherscan <ExternalLink size={10} />
              </a>
            </>
          )}
        </div>
      </div>

      {/* NEW pill stays visible for the full highlight duration */}
      {highlighted && (
        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-primary/20 text-primary animate-fade-in-up">
          NEW
        </span>
      )}
    </div>
  );
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  if (activities.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-10 h-10 rounded-full bg-bg-elevated mx-auto mb-3 flex items-center justify-center">
          <Flag size={18} className="text-text-muted" />
        </div>
        <p className="text-text-muted text-sm">Click &quot;Start Delegation&quot; to begin</p>
        <p className="text-text-muted text-xs mt-1 opacity-60">Events will appear here in real-time</p>
      </div>
    );
  }

  return (
    <div ref={feedRef} className="glass-card p-3 space-y-1">
      {/* Header count */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-border mb-2">
        <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Events</span>
        <span
          key={activities.length}
          className="text-xs font-mono text-primary animate-num-pop"
        >
          {activities.length}
        </span>
      </div>

      {activities.map((event, i) => (
        <ActivityRow key={event.id} event={event} index={i} />
      ))}
    </div>
  );
}
