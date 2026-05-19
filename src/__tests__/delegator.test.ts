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
  WORKER_BUDGET_USDC: 10,
  CHAIN_ID: 11155111,
  USDC_ADDRESS: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
}));

const mockSdkDelegation = {
  delegate: '0x0000000000000000000000000000000000000002' as `0x${string}`,
  delegator: '0x0000000000000000000000000000000000000001' as `0x${string}`,
  authority: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as `0x${string}`,
  caveats: [],
  salt: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
  signature: '0x' as `0x${string}`,
};

jest.mock('@metamask/smart-accounts-kit', () => ({
  createDelegation: jest.fn(() => ({ ...mockSdkDelegation })),
  getSmartAccountsEnvironment: jest.fn(() => ({
    DelegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
  })),
  ScopeType: { Erc20TransferAmount: 'erc20TransferAmount' },
  CaveatType: {
    LimitedCalls: 'limitedCalls',
    Erc20TransferAmount: 'erc20TransferAmount',
    Redeemer: 'redeemer',
  },
  signDelegation: jest.fn(() => Promise.resolve('0xfakesignature000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c' as `0x${string}`)),
}));

jest.mock('@metamask/delegation-core', () => ({
  hashDelegation: jest.fn(() => '0xhashABCDEF1234' as `0x${string}`),
  encodeDelegations: jest.fn(() => '0xencoded1234' as `0x${string}`),
  decodeDelegations: jest.fn(),
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({
    address: '0x0000000000000000000000000000000000000001' as `0x${string}`,
  })),
}));

jest.mock('@/lib/relay', () => ({
  sendTransaction: jest.fn(() => Promise.resolve({
    taskId: 'mock-task-id',
    status: 'submitted',
  })),
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

const FAKE_KEY = '0x' + 'ab'.repeat(32);

beforeEach(() => {
  _isDemo = true;
  process.env.PRIVATE_KEY_USER = FAKE_KEY;
  process.env.PRIVATE_KEY_MASTER = FAKE_KEY;
  process.env.PRIVATE_KEY_DATA_WORKER = FAKE_KEY;
  process.env.PRIVATE_KEY_EXEC_WORKER = FAKE_KEY;
  jest.clearAllMocks();
});

afterEach(() => {
  delete process.env.PRIVATE_KEY_USER;
  delete process.env.PRIVATE_KEY_MASTER;
  delete process.env.PRIVATE_KEY_DATA_WORKER;
  delete process.env.PRIVATE_KEY_EXEC_WORKER;
});

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

  it('returns address derived from private key', async () => {
    const addr = await createSmartAccount('user');
    expect(typeof addr).toBe('string');
    expect(addr.startsWith('0x')).toBe(true);
  });

  it('throws when private key env var is missing', async () => {
    delete process.env.PRIVATE_KEY_USER;
    await expect(createSmartAccount('user')).rejects.toThrow('Missing env PRIVATE_KEY_USER');
  });

  it('throws when private key is not a valid 32-byte hex string', async () => {
    process.env.PRIVATE_KEY_USER = '0x-not-a-real-key';
    await expect(createSmartAccount('user')).rejects.toThrow(
      'Invalid PRIVATE_KEY_USER: must be a 0x-prefixed 32-byte hex string (64 hex chars)'
    );
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

  it('creates and returns a signed root delegation', async () => {
    const delegation = await requestPermissions();
    expect(delegation.id).toBeTruthy();
    expect(delegation.status).toBe('active');
    expect(delegation.signature).toBeTruthy();
  });

  it('throws when private key env var is missing', async () => {
    delete process.env.PRIVATE_KEY_USER;
    await expect(requestPermissions()).rejects.toThrow('Missing env PRIVATE_KEY_USER');
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

  it('creates and returns a signed sub-delegation', async () => {
    const d = await createDelegationWithCaveats({
      delegator: '0x0000000000000000000000000000000000000001',
      delegate: '0x0000000000000000000000000000000000000002',
      caveats: [{ type: 'LimitedCalls', value: 2 }],
    });
    expect(d.id).toBeTruthy();
    expect(d.status).toBe('active');
  });

  it('maps all known caveat types correctly', async () => {
    await expect(
      createDelegationWithCaveats({
        delegator: '0x1',
        delegate: '0x2',
        caveats: [
          { type: 'Erc20TransferAmount', value: '10000000' },
          { type: 'LimitedCalls', value: 2 },
          { type: 'Redeemer', value: '0x0000000000000000000000000000000000000002' },
        ],
      })
    ).resolves.toBeTruthy();
  });

  it('passes unknown caveat type through to SDK as-is', async () => {
    await expect(
      createDelegationWithCaveats({
        delegator: '0x1',
        delegate: '0x2',
        caveats: [{ type: 'UnknownType' as never, value: 'x' }],
      })
    ).resolves.toBeTruthy();
  });

  it('uses parentDelegation from store when id matches cached delegation', async () => {
    // Populate the store by creating a delegation first
    const parent = await requestPermissions();
    // Now create sub-delegation referencing the cached parent
    const child = await createDelegationWithCaveats({
      delegator: '0x0000000000000000000000000000000000000001',
      delegate: '0x0000000000000000000000000000000000000002',
      caveats: [],
      parentDelegation: parent.id,
    });
    expect(child.parentDelegation).toBe(parent.id);
  });

  it('throws when private key env var is missing', async () => {
    delete process.env.PRIVATE_KEY_MASTER;
    await expect(
      createDelegationWithCaveats({ delegator: '0x', delegate: '0x', caveats: [] })
    ).rejects.toThrow('Missing env PRIVATE_KEY_MASTER');
  });
});

describe('settleDelegationChain — demo mode', () => {
  it('resolves to undefined', async () => {
    await expect(settleDelegationChain('deleg-001')).resolves.toBeUndefined();
  });
});

describe('settleDelegationChain — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('returns taskId for unknown delegation id', async () => {
    const taskId = await settleDelegationChain('unknown-id-xyz');
    expect(typeof taskId).toBe('string');
    expect(taskId).toBeTruthy();
  });

  it('returns taskId with encoded delegation when id is known', async () => {
    const d = await createDelegationWithCaveats({
      delegator: '0x0000000000000000000000000000000000000001',
      delegate: '0x0000000000000000000000000000000000000002',
      caveats: [],
    });
    const taskId = await settleDelegationChain(d.id);
    expect(typeof taskId).toBe('string');
    expect(taskId).toBeTruthy();
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
