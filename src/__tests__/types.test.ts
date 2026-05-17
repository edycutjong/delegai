import type { DemoStep } from '../lib/types';

describe('Types', () => {
  it('types should be parsed correctly', () => {
    const step: DemoStep = 'idle';
    expect(step).toBe('idle');
  });
});
