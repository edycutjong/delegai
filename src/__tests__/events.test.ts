import { eventBus } from '@/lib/events';
import type { ActivityEvent } from '@/lib/types';

const makeEvent = (id: string): ActivityEvent => ({
  id,
  type: 'delegation_created',
  agent: 'user',
  message: 'test event',
  timestamp: Date.now(),
});

describe('EventBus', () => {
  it('subscribe increases subscriber count', () => {
    const before = eventBus.subscriberCount;
    const unsub = eventBus.subscribe(() => {});
    expect(eventBus.subscriberCount).toBe(before + 1);
    unsub();
    expect(eventBus.subscriberCount).toBe(before);
  });

  it('delivers emitted events to subscriber', () => {
    const received: ActivityEvent[] = [];
    const unsub = eventBus.subscribe((e) => received.push(e));

    const event = makeEvent('evt-deliver');
    eventBus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(event);
    unsub();
  });

  it('broadcasts to multiple subscribers', () => {
    const counts = [0, 0];
    const unsub1 = eventBus.subscribe(() => counts[0]++);
    const unsub2 = eventBus.subscribe(() => counts[1]++);

    eventBus.emit(makeEvent('evt-broadcast'));
    expect(counts).toEqual([1, 1]);

    unsub1();
    unsub2();
  });

  it('unsubscribe stops future event delivery', () => {
    const received: ActivityEvent[] = [];
    const unsub = eventBus.subscribe((e) => received.push(e));

    eventBus.emit(makeEvent('before-unsub'));
    unsub();
    eventBus.emit(makeEvent('after-unsub'));

    expect(received).toHaveLength(1);
    expect(received[0].id).toBe('before-unsub');
  });

  it('returns a callable unsubscribe function', () => {
    const unsub = eventBus.subscribe(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('emit with no subscribers is a no-op', () => {
    const before = eventBus.subscriberCount;
    expect(() => eventBus.emit(makeEvent('no-subs'))).not.toThrow();
    expect(eventBus.subscriberCount).toBe(before);
  });
});
