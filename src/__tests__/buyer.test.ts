import { fetchPremiumData } from '../lib/buyer';
import { MOCK_MARKET_FEED, MOCK_DEFI_YIELDS } from '../lib/mock-data';

beforeEach(() => {
  global.fetch = jest.fn();
  jest.clearAllMocks();
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
