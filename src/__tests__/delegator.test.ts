let _isDemo = true;

jest.mock('@/lib/constants', () => ({
  get IS_DEMO() { return _isDemo; },
  DEMO_ADDRESSES: {
    user: '0xAl1c3000000000000000000000000000000dEaD1',
    master: '0xMa5t3R00000000000000000000000000000dEaD2',
    dataWorker: '0xDa7a000000000000000000000000000000dEaD3',
    execWorker: '0x3x3c000000000000000000000000000000dEaD4',
    usdc: '0xU5DC0000000000000000000000000000000dEaD5',
  },
  toUsdcRaw: (n: number) => String(Math.round(n * 1e6)),
  ROOT_BUDGET_USDC: 50,
  ROOT_MAX_CALLS: 5,
}));

import {
  createSmartAccount,
  requestPermissions,
  createDelegationWithCaveats,
  settleDelegationChain,
  toUsdcRaw,
  ROOT_BUDGET_USDC,
  ROOT_MAX_CALLS,
} from '@/lib/delegator';

beforeEach(() => { _isDemo = true; });

describe('createSmartAccount — demo mode', () => {
  it('returns user address for role "user"', async () => {
    const addr = await createSmartAccount('user');
    expect(addr).toBe('0xAl1c3000000000000000000000000000000dEaD1');
  });

  it('returns master address for role "master"', async () => {
    expect(await createSmartAccount('master')).toBe('0xMa5t3R00000000000000000000000000000dEaD2');
  });

  it('returns data-worker address', async () => {
    expect(await createSmartAccount('data-worker')).toBe('0xDa7a000000000000000000000000000000dEaD3');
  });

  it('returns exec-worker address', async () => {
    expect(await createSmartAccount('exec-worker')).toBe('0x3x3c000000000000000000000000000000dEaD4');
  });

  it('returns fallback for unknown role', async () => {
    const addr = await createSmartAccount('unknown');
    expect(addr).toContain('...demo');
  });
});

describe('createSmartAccount — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('throws live mode error', async () => {
    await expect(createSmartAccount('user')).rejects.toThrow('Live mode not yet implemented');
  });
});

describe('requestPermissions — demo mode', () => {
  it('returns a root delegation', async () => {
    const delegation = await requestPermissions();
    expect(delegation.id).toBeTruthy();
    expect(delegation.status).toBe('active');
    expect(delegation.caveats.length).toBeGreaterThan(0);
  });

  it('delegation has Erc20TransferAmount caveat', async () => {
    const delegation = await requestPermissions();
    expect(delegation.caveats.some((c) => c.type === 'Erc20TransferAmount')).toBe(true);
  });
});

describe('requestPermissions — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('throws live mode error', async () => {
    await expect(requestPermissions()).rejects.toThrow('Live mode not yet implemented');
  });
});

describe('createDelegationWithCaveats — demo mode', () => {
  const params = {
    delegator: '0xmaster',
    delegate: '0xworker',
    caveats: [{ type: 'LimitedCalls' as const, value: 2 }],
  };

  it('returns a delegation with correct fields', async () => {
    const d = await createDelegationWithCaveats(params);
    expect(d.delegator).toBe('0xmaster');
    expect(d.delegate).toBe('0xworker');
    expect(d.caveats).toEqual(params.caveats);
    expect(d.status).toBe('active');
    expect(d.signature).toBeTruthy();
    expect(d.id).toBeTruthy();
  });

  it('sets parentDelegation when provided', async () => {
    const d = await createDelegationWithCaveats({ ...params, parentDelegation: 'root-001' });
    expect(d.parentDelegation).toBe('root-001');
  });

  it('parentDelegation is undefined when not provided', async () => {
    const d = await createDelegationWithCaveats(params);
    expect(d.parentDelegation).toBeUndefined();
  });

  it('each call returns a unique id', async () => {
    const d1 = await createDelegationWithCaveats(params);
    const d2 = await createDelegationWithCaveats(params);
    expect(d1.id).not.toBe(d2.id);
  });
});

describe('createDelegationWithCaveats — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('throws live mode error', async () => {
    await expect(
      createDelegationWithCaveats({ delegator: '0x', delegate: '0x', caveats: [] })
    ).rejects.toThrow('Live mode not yet implemented');
  });
});

describe('settleDelegationChain — demo mode', () => {
  it('resolves without error', async () => {
    await expect(settleDelegationChain('deleg-001')).resolves.toBeUndefined();
  });
});

describe('settleDelegationChain — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('throws live mode error', async () => {
    await expect(settleDelegationChain('deleg-001')).rejects.toThrow('Live mode not yet implemented');
  });
});

describe('re-exports', () => {
  it('re-exports toUsdcRaw', () => {
    expect(toUsdcRaw(1)).toBe('1000000');
  });

  it('re-exports ROOT_BUDGET_USDC', () => {
    expect(ROOT_BUDGET_USDC).toBe(50);
  });

  it('re-exports ROOT_MAX_CALLS', () => {
    expect(ROOT_MAX_CALLS).toBe(5);
  });
});
