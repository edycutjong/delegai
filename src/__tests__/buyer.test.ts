import { fetchPremiumData } from '../lib/buyer';
import { MOCK_MARKET_FEED, MOCK_DEFI_YIELDS } from '../lib/mock-data';
import * as constants from '../lib/constants';

// No global mock, we use jest.doMock for specific tests

describe('Buyer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('handles successful payment flow for market-feed', async () => {
    // Mock first fetch (402)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 402,
      headers: {
        get: jest.fn().mockReturnValue('mock-requirement'),
      },
    });

    // Mock second fetch (200)
    const mockData = { data: 'premium' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await fetchPremiumData('market-feed');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws error if initial response is not 402', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
    });

    await expect(fetchPremiumData('market-feed')).rejects.toThrow('Expected 402, got 200');
  });

  it('throws error if PAYMENT-REQUIRED header is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 402,
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    });

    await expect(fetchPremiumData('market-feed')).rejects.toThrow('Missing PAYMENT-REQUIRED header');
  });

  it('throws error if paid response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 402,
      headers: {
        get: jest.fn().mockReturnValue('mock-requirement'),
      },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchPremiumData('market-feed')).rejects.toThrow('Payment failed: 500');
  });

  it('returns mock market feed when IS_DEMO is true', async () => {
    jest.resetModules();
    jest.doMock('../lib/constants', () => ({
      ...jest.requireActual('../lib/constants'),
      IS_DEMO: true
    }));
    const { fetchPremiumData } = require('../lib/buyer');
    const result = await fetchPremiumData('market-feed');
    expect(result).toEqual(MOCK_MARKET_FEED);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns mock defi yields when IS_DEMO is true', async () => {
    jest.resetModules();
    jest.doMock('../lib/constants', () => ({
      ...jest.requireActual('../lib/constants'),
      IS_DEMO: true
    }));
    const { fetchPremiumData } = require('../lib/buyer');
    const result = await fetchPremiumData('defi-yields');
    expect(result).toEqual(MOCK_DEFI_YIELDS);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
