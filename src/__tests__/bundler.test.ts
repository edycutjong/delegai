let _isDemo = true;

jest.mock('@/lib/constants', () => ({
  get IS_DEMO() { return _isDemo; },
  CHAIN_ID: 11155111,
}));

const mockExtend = jest.fn((extFn: (c: unknown) => unknown) => extFn({}));
const mockCreatePublicClient = jest.fn((_opts?: unknown) => ({ extend: mockExtend }));

jest.mock('viem', () => ({
  createPublicClient: (opts: unknown) => mockCreatePublicClient(opts),
  http: jest.fn((url: string) => ({ url })),
}));

jest.mock('@metamask/smart-accounts-kit/actions', () => ({
  erc7710BundlerActions: jest.fn(() => (client: unknown) => ({
    sendUserOperationWithDelegation: jest.fn(),
    _client: client,
  })),
  erc7715ProviderActions: jest.fn(() => (client: unknown) => ({
    requestExecutionPermissions: jest.fn(),
    _client: client,
  })),
}));

import { createErc7710BundlerClient, createErc7715ProviderClient } from '@/lib/bundler';

beforeEach(() => {
  _isDemo = true;
  jest.clearAllMocks();
});

describe('createErc7710BundlerClient — demo mode', () => {
  it('returns null without calling viem or SDK', async () => {
    const client = await createErc7710BundlerClient('https://bundler.example.com');
    expect(client).toBeNull();
    expect(mockCreatePublicClient).not.toHaveBeenCalled();
  });
});

describe('createErc7710BundlerClient — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('creates a public client extended with erc7710BundlerActions', async () => {
    const client = await createErc7710BundlerClient('https://bundler.example.com');
    expect(client).toBeDefined();
    expect(mockCreatePublicClient).toHaveBeenCalledWith(
      expect.objectContaining({ chain: expect.objectContaining({ id: 11155111 }) })
    );
    expect(mockExtend).toHaveBeenCalled();
  });

  it('uses the provided bundler URL as transport', async () => {
    await createErc7710BundlerClient('https://my-bundler.io');
    const { http } = await import('viem');
    expect(http).toHaveBeenCalledWith('https://my-bundler.io');
  });

  it('exposes sendUserOperationWithDelegation on the returned client', async () => {
    const client = await createErc7710BundlerClient('https://bundler.example.com');
    expect(client).toHaveProperty('sendUserOperationWithDelegation');
  });
});

describe('createErc7715ProviderClient — demo mode', () => {
  it('returns null without calling viem or SDK', async () => {
    const client = await createErc7715ProviderClient('https://rpc.example.com');
    expect(client).toBeNull();
    expect(mockCreatePublicClient).not.toHaveBeenCalled();
  });
});

describe('createErc7715ProviderClient — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('creates a public client extended with erc7715ProviderActions', async () => {
    const client = await createErc7715ProviderClient('https://rpc.example.com');
    expect(client).toBeDefined();
    expect(mockCreatePublicClient).toHaveBeenCalledWith(
      expect.objectContaining({ chain: expect.objectContaining({ id: 11155111 }) })
    );
    expect(mockExtend).toHaveBeenCalled();
  });

  it('uses the provided provider URL as transport', async () => {
    await createErc7715ProviderClient('https://my-rpc.io');
    const { http } = await import('viem');
    expect(http).toHaveBeenCalledWith('https://my-rpc.io');
  });

  it('exposes requestExecutionPermissions on the returned client', async () => {
    const client = await createErc7715ProviderClient('https://rpc.example.com');
    expect(client).toHaveProperty('requestExecutionPermissions');
  });
});
