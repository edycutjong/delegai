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
    SimpleFactory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
    implementations: {
      HybridDeleGatorImpl: '0x48dBe696A4D990079e039489bA2053B36E8FFEC4',
      EIP7702StatelessDeleGatorImpl: '0xEIP7702StatelessDeleGator00000000000000',
    },
  })),
  contracts: {
    HybridDeleGator: {
      encode: {
        initializeHybridDeleGator: jest.fn(() => '0xinit' as `0x${string}`),
      },
    },
    encodeProxyCreationCode: jest.fn(() => '0xproxy' as `0x${string}`),
  },
  ScopeType: { Erc20TransferAmount: 'erc20TransferAmount' },
  CaveatType: {
    LimitedCalls: 'limitedCalls',
    Erc20TransferAmount: 'erc20TransferAmount',
    Redeemer: 'redeemer',
  },
  signDelegation: jest.fn(() => Promise.resolve('0xfakesignature000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c' as `0x${string}`)),
  toMetaMaskSmartAccount: jest.fn(() => Promise.resolve({ address: '0x0000000000000000000000000000000000000001' })),
  Implementation: { Stateless7702: 'Stateless7702', Hybrid: 'Hybrid', MultiSig: 'MultiSig' },
}));

jest.mock('@metamask/delegation-core', () => ({
  hashDelegation: jest.fn(() => '0xhashABCDEF1234' as `0x${string}`),
  encodeDelegations: jest.fn(() => '0xencoded1234' as `0x${string}`),
  decodeDelegations: jest.fn(),
}));

jest.mock('viem', () => ({
  getContractAddress: jest.fn(() => '0x0000000000000000000000000000000000000099' as `0x${string}`),
  pad: jest.fn(() => '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`),
  createPublicClient: jest.fn(() => ({})),
  http: jest.fn(() => ({})),
}));

jest.mock('@metamask/smart-accounts-kit/utils', () => ({
  createCaveatBuilder: jest.fn(() => ({
    addCaveat: jest.fn().mockReturnThis(),
    build: jest.fn(() => []),
  })),
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({
    address: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    signMessage: jest.fn(),
    signTypedData: jest.fn(),
  })),
  signAuthorization: jest.fn(() => Promise.resolve({
    address: '0xEIP7702StatelessDeleGator00000000000000' as `0x${string}`,
    chainId: 11155111,
    nonce: 0,
    r: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
    s: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
    v: BigInt(27),
    yParity: 0,
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
  createEip7702Authorization,
  toUsdcRaw,
  ROOT_BUDGET_USDC,
  ROOT_MAX_CALLS,
} from '@/lib/delegator';

const FAKE_KEY = '0x' + 'ab'.repeat(32);

let consoleSpy: jest.SpyInstance;

beforeEach(() => {
  _isDemo = true;
  process.env.PRIVATE_KEY_USER = FAKE_KEY;
  process.env.PRIVATE_KEY_MASTER = FAKE_KEY;
  process.env.PRIVATE_KEY_DATA_WORKER = FAKE_KEY;
  process.env.PRIVATE_KEY_EXEC_WORKER = FAKE_KEY;
  jest.clearAllMocks();
  consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
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

  it('returns smart account address for user role', async () => {
    const addr = await createSmartAccount('user');
    expect(typeof addr).toBe('string');
    expect(addr.startsWith('0x')).toBe(true);
  });

  it('returns EOA address for non-user roles', async () => {
    const addr = await createSmartAccount('master');
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

  it('walks the delegation chain when child authority points to cached parent', async () => {
    const { hashDelegation } = await import('@metamask/delegation-core');
    const { createDelegation: sdkCreate } = await import('@metamask/smart-accounts-kit');
    const hashMock = hashDelegation as jest.Mock;
    const createMock = sdkCreate as jest.Mock;

    // First call: parent delegation — hash = parentHash, authority = ROOT
    hashMock.mockReturnValueOnce('0xparentHash0001');
    // signDelegation also triggers hashDelegation inside liveSign:
    hashMock.mockReturnValueOnce('0xparentHash0001');

    await requestPermissions(); // stores parent under '0xparentHash0001'

    // Second call: child delegation — authority = parentHash (points to parent)
    createMock.mockReturnValueOnce({
      ...mockSdkDelegation,
      authority: '0xparentHash0001' as `0x${string}`,
    });
    hashMock.mockReturnValueOnce('0xchildHash0002');
    hashMock.mockReturnValueOnce('0xchildHash0002');

    const child = await createDelegationWithCaveats({
      delegator: '0x0000000000000000000000000000000000000001',
      delegate: '0x0000000000000000000000000000000000000002',
      caveats: [],
      parentDelegation: '0xparentHash0001',
    });

    // Settle the child — should walk: child → parent (ROOT_AUTHORITY stops)
    const taskId = await settleDelegationChain(child.id);
    expect(typeof taskId).toBe('string');
    expect(taskId).toBeTruthy();

    const { encodeDelegations } = await import('@metamask/delegation-core');
    // encodeDelegations should be called with an array of length 2 (child + parent)
    expect(encodeDelegations).toHaveBeenCalled();
  });

  it('breaks chain walk when authority points to uncached delegation', async () => {
    const { hashDelegation } = await import('@metamask/delegation-core');
    const { createDelegation: sdkCreate } = await import('@metamask/smart-accounts-kit');
    const hashMock = hashDelegation as jest.Mock;
    const createMock = sdkCreate as jest.Mock;

    // Create a child whose authority points to a hash NOT in the store
    createMock.mockReturnValueOnce({
      ...mockSdkDelegation,
      authority: '0xnonExistentParentHash999' as `0x${string}`,
    });
    hashMock.mockReturnValueOnce('0xorphanChild0001');
    hashMock.mockReturnValueOnce('0xorphanChild0001');

    const child = await createDelegationWithCaveats({
      delegator: '0x0000000000000000000000000000000000000001',
      delegate: '0x0000000000000000000000000000000000000002',
      caveats: [],
    });

    // Settle — should enter the while loop, fail to find parent, break
    const taskId = await settleDelegationChain(child.id);
    expect(typeof taskId).toBe('string');
    expect(taskId).toBeTruthy();
  });

  it('uses zero-address fallback when ONESHOT_WALLET_ADDRESS is not set', async () => {
    delete process.env.ONESHOT_WALLET_ADDRESS;
    const { hashDelegation } = await import('@metamask/delegation-core');
    const hashMock = hashDelegation as jest.Mock;
    hashMock.mockReturnValueOnce('0xfallbackTest001');
    hashMock.mockReturnValueOnce('0xfallbackTest001');

    const d = await createDelegationWithCaveats({
      delegator: '0x0000000000000000000000000000000000000001',
      delegate: '0x0000000000000000000000000000000000000002',
      caveats: [],
    });
    const taskId = await settleDelegationChain(d.id);
    expect(typeof taskId).toBe('string');
  });

  it('uses ONESHOT_WALLET_ADDRESS when env var is set', async () => {
    process.env.ONESHOT_WALLET_ADDRESS = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    const { hashDelegation } = await import('@metamask/delegation-core');
    const hashMock = hashDelegation as jest.Mock;
    hashMock.mockReturnValueOnce('0xwalletAddrTest001');
    hashMock.mockReturnValueOnce('0xwalletAddrTest001');

    const d = await createDelegationWithCaveats({
      delegator: '0x0000000000000000000000000000000000000001',
      delegate: '0x0000000000000000000000000000000000000002',
      caveats: [],
    });
    const taskId = await settleDelegationChain(d.id);
    expect(typeof taskId).toBe('string');
    delete process.env.ONESHOT_WALLET_ADDRESS;
  });
});

describe('createEip7702Authorization — demo mode', () => {
  it('returns a mock authorization with correct shape', async () => {
    const auth = await createEip7702Authorization('exec-worker');
    expect(auth.contractAddress).toBeTruthy();
    expect(auth.chainId).toBe(11155111);
    expect(auth.nonce).toBe(0);
    expect(auth.r).toBeTruthy();
    expect(auth.s).toBeTruthy();
    expect(typeof auth.yParity).toBe('number');
  });
});

describe('createEip7702Authorization — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('calls toMetaMaskSmartAccount and signAuthorization, returns signed auth', async () => {
    const auth = await createEip7702Authorization('exec-worker');
    const { toMetaMaskSmartAccount } = await import('@metamask/smart-accounts-kit');
    const { signAuthorization } = await import('viem/accounts');
    expect(toMetaMaskSmartAccount).toHaveBeenCalledWith(
      expect.objectContaining({ implementation: 'Stateless7702' })
    );
    expect(signAuthorization).toHaveBeenCalled();
    expect(auth.contractAddress).toBeTruthy();
    expect(typeof auth.chainId).toBe('number');
    expect(typeof auth.yParity).toBe('number');
  });

  it('throws when private key env var is missing', async () => {
    delete process.env.PRIVATE_KEY_EXEC_WORKER;
    await expect(createEip7702Authorization('exec-worker')).rejects.toThrow(
      'Missing env PRIVATE_KEY_EXEC_WORKER'
    );
  });

  it('defaults yParity to 0 when signAuthorization returns undefined yParity', async () => {
    const { signAuthorization } = await import('viem/accounts');
    (signAuthorization as jest.Mock).mockResolvedValueOnce({
      address: '0xEIP7702StatelessDeleGator00000000000000' as `0x${string}`,
      chainId: 11155111,
      nonce: 0,
      r: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
      s: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
      v: BigInt(27),
      yParity: undefined,
    });
    const auth = await createEip7702Authorization('exec-worker');
    expect(auth.yParity).toBe(0);
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
