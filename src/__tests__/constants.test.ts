import {
  CHAIN_ID,
  CHAIN_NAME,
  ROOT_BUDGET_USDC,
  ROOT_MAX_CALLS,
  WORKER_BUDGET_USDC,
  WORKER_MAX_CALLS,
  X402_COST_PER_CALL,
  USDC_DECIMALS,
  DEMO_ADDRESSES,
  COLORS,
  toUsdcRaw,
} from '@/lib/constants';

describe('constants', () => {
  it('has Sepolia chain id', () => {
    expect(CHAIN_ID).toBe(11155111);
  });

  it('has correct chain name', () => {
    expect(CHAIN_NAME).toBe('Ethereum Sepolia');
  });

  it('has correct delegation budget defaults', () => {
    expect(ROOT_BUDGET_USDC).toBe(50);
    expect(ROOT_MAX_CALLS).toBe(5);
    expect(WORKER_BUDGET_USDC).toBe(10);
    expect(WORKER_MAX_CALLS).toBe(2);
    expect(X402_COST_PER_CALL).toBe(0.01);
  });

  it('has 6 USDC decimals', () => {
    expect(USDC_DECIMALS).toBe(6);
  });

  describe('toUsdcRaw', () => {
    it('converts 1 USDC → 1_000_000 raw', () => {
      expect(toUsdcRaw(1)).toBe('1000000');
    });

    it('converts root budget (50 USDC)', () => {
      expect(toUsdcRaw(ROOT_BUDGET_USDC)).toBe('50000000');
    });

    it('converts worker budget (10 USDC)', () => {
      expect(toUsdcRaw(WORKER_BUDGET_USDC)).toBe('10000000');
    });

    it('converts x402 cost (0.01 USDC)', () => {
      expect(toUsdcRaw(X402_COST_PER_CALL)).toBe('10000');
    });

    it('returns a string', () => {
      expect(typeof toUsdcRaw(1)).toBe('string');
    });
  });

  it('has all 5 demo addresses', () => {
    const keys = ['user', 'master', 'dataWorker', 'execWorker', 'usdc'] as const;
    keys.forEach((k) => expect(DEMO_ADDRESSES[k]).toBeTruthy());
  });

  it('has correct primary color token', () => {
    expect(COLORS.primary).toBe('#06b6d4');
  });

  it('has correct success color token', () => {
    expect(COLORS.success).toBe('#22c55e');
  });

  it('has correct warning color token', () => {
    expect(COLORS.warning).toBe('#f59e0b');
  });
});

describe('STEP_DELAY', () => {
  it('is 500ms when DELEGAI_DEMO_SPEED=fast', () => {
    let mod: typeof import('@/lib/constants');
    jest.isolateModules(() => {
      process.env.DELEGAI_DEMO_SPEED = 'fast';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('@/lib/constants');
    });
    expect(mod!.STEP_DELAY).toBe(500);
    delete process.env.DELEGAI_DEMO_SPEED;
  });

  it('is 1500ms when DELEGAI_DEMO_SPEED is not fast', () => {
    let mod: typeof import('@/lib/constants');
    jest.isolateModules(() => {
      delete process.env.DELEGAI_DEMO_SPEED;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('@/lib/constants');
    });
    expect(mod!.STEP_DELAY).toBe(1500);
  });
});
