'use client';

import { useRef, useEffect } from 'react';
import type { ActivityEvent } from '@/lib/types';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

import { Link2, PenLine, CornerDownRight, CreditCard, BarChart2, Rocket, CheckCircle2, Flag, XCircle } from 'lucide-react';

const TYPE_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  delegation_created: { icon: <Link2 size={18} />, color: 'text-primary' },
  delegation_signed: { icon: <PenLine size={18} />, color: 'text-primary' },
  sub_delegation_created: { icon: <CornerDownRight size={18} />, color: 'text-info' },
  x402_payment_sent: { icon: <CreditCard size={18} />, color: 'text-warning' },
  x402_data_received: { icon: <BarChart2 size={18} />, color: 'text-success' },
  relay_submitted: { icon: <Rocket size={18} />, color: 'text-warning' },
  relay_confirmed: { icon: <CheckCircle2 size={18} />, color: 'text-success' },
  chain_settled: { icon: <Flag size={18} />, color: 'text-primary' },
  error: { icon: <XCircle size={18} />, color: 'text-danger' },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-text-muted text-sm">
          Click &quot;Start Delegation&quot; to begin
        </p>
      </div>
    );
  }

  return (
    <div ref={feedRef} className="glass-card p-4 max-h-[600px] overflow-y-auto space-y-2">
      {activities.map((event, i) => {
        const style = TYPE_STYLES[event.type] || TYPE_STYLES.error;
        return (
          <div
            key={event.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-elevated/30 transition-colors animate-fade-in-up"
            style={{ animationDelay: `${Math.min(i, 1) * 40}ms` }}
          >
            <span className="text-lg mt-0.5 shrink-0">{style.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${style.color}`}>{event.message}</p>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                {new Date(event.timestamp).toLocaleTimeString()} · {event.agent}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
