jest.mock('@metamask/smart-accounts-kit', () => ({
  createOpenDelegation: jest.fn(() => ({
    delegate: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    delegator: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    authority: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as `0x${string}`,
    caveats: [],
    salt: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
    signature: '0x' as `0x${string}`,
  })),
  getSmartAccountsEnvironment: jest.fn(() => ({
    DelegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
  })),
  ScopeType: { Erc20TransferAmount: 'erc20TransferAmount' },
  signDelegation: jest.fn(() => Promise.resolve('0xpaymentSignatureHex' as `0x${string}`)),
}));

jest.mock('@metamask/delegation-core', () => ({
  encodeDelegations: jest.fn(() => '0xencoded' as `0x${string}`),
  decodeDelegations: jest.fn(),
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({
    address: '0x0000000000000000000000000000000000000001' as `0x${string}`,
  })),
}));

import { fetchPremiumData } from '../lib/buyer';
import { MOCK_MARKET_FEED, MOCK_DEFI_YIELDS } from '../lib/mock-data';

const FAKE_KEY = '0x' + 'ab'.repeat(32);

beforeEach(() => {
  global.fetch = jest.fn();
  process.env.PRIVATE_KEY_DATA_WORKER = FAKE_KEY;
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  jest.clearAllMocks();
});

afterEach(() => {
  delete process.env.PRIVATE_KEY_DATA_WORKER;
  delete process.env.NEXT_PUBLIC_BASE_URL; // ensure fallback path is tested explicitly
});

describe('live mode (IS_DEMO=false)', () => {
  it('throws when server returns non-402 status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 200 });
    await expect(fetchPremiumData('market-feed')).rejects.toThrow('Expected 402, got 200');
  });

  it('throws when PAYMENT-REQUIRED header is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 402,
      headers: { get: jest.fn().mockReturnValue(null) },
    });
    await expect(fetchPremiumData('market-feed')).rejects.toThrow('Missing PAYMENT-REQUIRED header');
  });

  it('throws when paid response is not ok', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 402,
        headers: { get: jest.fn().mockReturnValue('{"scheme":"test"}') },
      })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchPremiumData('market-feed')).rejects.toThrow('Payment failed: 500');
  });

  it('returns data when 402 → payment → 200 succeeds', async () => {
    const body = { source: 'live', cost: '0.01', timestamp: 'now' };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 402,
        headers: { get: jest.fn().mockReturnValue('{"scheme":"test"}') },
      })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(body) });
    const data = await fetchPremiumData('defi-yields');
    expect(data.source).toBe('live');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('sends PAYMENT-SIGNATURE header on retry', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 402,
        headers: { get: jest.fn().mockReturnValue('{"scheme":"test"}') },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ source: 'ok', cost: '0', timestamp: 'now' }),
      });
    await fetchPremiumData('market-feed');
    const [, opts] = (global.fetch as jest.Mock).mock.calls[1];
    expect(opts.headers['PAYMENT-SIGNATURE']).toBeDefined();
  });

  it('throws when PRIVATE_KEY_DATA_WORKER is missing during payment signature', async () => {
    delete process.env.PRIVATE_KEY_DATA_WORKER;
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 402,
        headers: { get: jest.fn().mockReturnValue('{"scheme":"test"}') },
      });
    await expect(fetchPremiumData('market-feed')).rejects.toThrow('Missing env PRIVATE_KEY_DATA_WORKER');
  });

  it('uses localhost:3000 fallback when NEXT_PUBLIC_BASE_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(fetchPremiumData('market-feed')).rejects.toThrow(
      'x402 fetch to http://localhost:3000/api/premium-data/market-feed failed'
    );
  });

  it('wraps network fetch errors with the attempted URL', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(fetchPremiumData('market-feed')).rejects.toThrow(
      'x402 fetch to http://localhost:3000/api/premium-data/market-feed failed'
    );
  });
});

describe('demo mode (IS_DEMO=true)', () => {
  function loadBuyerInDemoMode() {
    let mod: typeof import('../lib/buyer');
    jest.isolateModules(() => {
      jest.doMock('../lib/constants', () => ({
        ...jest.requireActual('../lib/constants'),
        IS_DEMO: true,
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('../lib/buyer');
    });
    return mod!;
  }

  it('returns mock market feed without calling fetch', async () => {
    const buyer = loadBuyerInDemoMode();
    const data = await buyer.fetchPremiumData('market-feed');
    expect(data).toEqual(MOCK_MARKET_FEED);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns mock defi yields without calling fetch', async () => {
    const buyer = loadBuyerInDemoMode();
    const data = await buyer.fetchPremiumData('defi-yields');
    expect(data).toEqual(MOCK_DEFI_YIELDS);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
