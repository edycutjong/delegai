let _isDemo = true;

jest.mock('@/lib/constants', () => ({
  get IS_DEMO() { return _isDemo; },
  CHAIN_ID: 11155111,
  X402_FACILITATOR: 'https://test-facilitator.example.com',
  X402_COST_PER_CALL: 0.01,
}));

const mockDelegation = {
  delegate: '0x0000000000000000000000000000000000000002' as `0x${string}`,
  delegator: '0x0000000000000000000000000000000000000001' as `0x${string}`,
  authority: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as `0x${string}`,
  caveats: [{ enforcer: '0x0000000000000000000000000000000000000003' as `0x${string}`, terms: '0x' as `0x${string}`, args: '0x' as `0x${string}` }],
  salt: BigInt(1),
  signature: '0xdeadbeef01' as `0x${string}`,
};

jest.mock('@metamask/delegation-core', () => ({
  decodeDelegations: jest.fn((sig: string) => {
    if (sig === '0xvalidencoded') return [{ ...mockDelegation }];
    if (sig === '0xreplaytest') return [{ ...mockDelegation }];
    if (sig === '0xbadsig') return [{ ...mockDelegation, signature: '0xbadsig' }];
    if (sig === '0xnosig') return [{ ...mockDelegation, signature: '0x' }];
    if (sig === '0xempty') return [];
    throw new Error('Invalid encoded delegation');
  }),
}));

jest.mock('@metamask/smart-accounts-kit', () => ({
  getSmartAccountsEnvironment: jest.fn(() => ({
    DelegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
  })),
}));

jest.mock('viem', () => ({
  verifyTypedData: jest.fn((params: { signature: string }) =>
    Promise.resolve(params.signature !== '0xbadsig')
  ),
}));

import { verifyTypedData } from 'viem';
import { verifyPayment, getPaymentRequirements, X402_COST_PER_CALL } from '@/lib/seller';

let consoleSpy: jest.SpyInstance;

beforeEach(() => {
  _isDemo = true;
  jest.clearAllMocks();
  consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
});

describe('verifyPayment — demo mode', () => {
  it('accepts null signature', async () => {
    expect(await verifyPayment(null)).toBe(true);
  });

  it('accepts any non-null signature', async () => {
    expect(await verifyPayment('mock-sig')).toBe(true);
    expect(await verifyPayment('0xdeadbeef')).toBe(true);
  });
});

describe('verifyPayment — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('rejects null signature', async () => {
    expect(await verifyPayment(null)).toBe(false);
  });

  it('rejects invalid encoded delegation', async () => {
    expect(await verifyPayment('not-valid-hex')).toBe(false);
  });

  it('rejects empty delegation array', async () => {
    expect(await verifyPayment('0xempty')).toBe(false);
  });

  it('rejects delegation with missing signature', async () => {
    expect(await verifyPayment('0xnosig')).toBe(false);
  });

  it('rejects delegation with invalid EIP-712 signature', async () => {
    // verifyTypedData mock returns false for '0xbadsig'
    expect(await verifyPayment('0xbadsig')).toBe(false);
  });

  it('accepts valid encoded delegation with valid EIP-712 signature', async () => {
    expect(await verifyPayment('0xvalidencoded')).toBe(true);
    expect(verifyTypedData).toHaveBeenCalledWith(
      expect.objectContaining({
        address: mockDelegation.delegator,
        primaryType: 'Delegation',
        domain: expect.objectContaining({
          name: 'DelegationManager',
          version: '1',
          chainId: 11155111,
        }),
      })
    );
  });

  it('rejects replayed signature (anti-replay)', async () => {
    // First call succeeds (fresh signature not used by any prior test)
    expect(await verifyPayment('0xreplaytest')).toBe(true);
    // Second call with same signature is rejected
    expect(await verifyPayment('0xreplaytest')).toBe(false);
  });
});

describe('getPaymentRequirements', () => {
  it('returns PAYMENT-REQUIRED header', () => {
    const headers = getPaymentRequirements();
    expect(headers['PAYMENT-REQUIRED']).toBeDefined();
  });

  it('header is valid JSON', () => {
    const headers = getPaymentRequirements();
    expect(() => JSON.parse(headers['PAYMENT-REQUIRED'])).not.toThrow();
  });

  it('header contains required fields', () => {
    const headers = getPaymentRequirements();
    const parsed = JSON.parse(headers['PAYMENT-REQUIRED']);
    expect(parsed.scheme).toBe('erc7710-exact-evm');
    expect(parsed.network).toBe('ethereum-sepolia');
    expect(parsed.maxAmountRequired).toBeDefined();
    expect(parsed.facilitator).toBe('https://test-facilitator.example.com');
  });

  it('maxAmountRequired reflects X402_COST_PER_CALL in USDC raw units', () => {
    const headers = getPaymentRequirements();
    const parsed = JSON.parse(headers['PAYMENT-REQUIRED']);
    expect(parsed.maxAmountRequired).toBe(String(0.01 * 1e6));
  });
});

describe('re-exports', () => {
  it('exports X402_COST_PER_CALL', () => {
    expect(X402_COST_PER_CALL).toBe(0.01);
  });
});
