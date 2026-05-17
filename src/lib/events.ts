/* ─────────────────────────────────────────────────────────
 * DelegAI — SSE Event Emitter
 * Server-Sent Events for real-time dashboard updates
 * ───────────────────────────────────────────────────────── */

import type { ActivityEvent } from './types';

type Listener = (event: ActivityEvent) => void;

class EventBus {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: ActivityEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  get subscriberCount(): number {
    return this.listeners.size;
  }
}

/** Singleton event bus for SSE broadcasting */
export const eventBus = new EventBus();
