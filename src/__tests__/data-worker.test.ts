import { runDataWorker } from '../agents/data-worker';
import { fetchPremiumData } from '../lib/buyer';
import { callVenice } from '../lib/venice';
import { eventBus } from '../lib/events';

jest.mock('../lib/buyer');
jest.mock('../lib/venice', () => ({ callVenice: jest.fn() }));
jest.mock('../lib/events', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}));

describe('Data Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (callVenice as jest.Mock).mockResolvedValue('Venice data insight.');
  });

  it('runs the data worker flow successfully', async () => {
    const mockData = { assets: ['asset1', 'asset2'] };
    (fetchPremiumData as jest.Mock).mockResolvedValue(mockData);

    const result = await runDataWorker();

    expect(result).toEqual(mockData);
    expect(fetchPremiumData).toHaveBeenCalledWith('market-feed');
    expect(callVenice).toHaveBeenCalledTimes(1);
    expect(eventBus.emit).toHaveBeenCalledTimes(3);

    expect(eventBus.emit).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'x402_payment_sent',
      agent: 'data-worker',
      message: expect.stringContaining('x402 payment:'),
    }));

    expect(eventBus.emit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'x402_data_received',
      agent: 'data-worker',
      message: expect.stringContaining('Premium data received: 2 assets'),
    }));

    expect(eventBus.emit).toHaveBeenNthCalledWith(3, expect.objectContaining({
      type: 'ai_reasoning',
      agent: 'data-worker',
      message: expect.stringContaining('Venice AI insight:'),
    }));
  });

  it('handles empty or invalid assets array', async () => {
    const mockData = { assets: undefined };
    (fetchPremiumData as jest.Mock).mockResolvedValue(mockData);

    await runDataWorker();

    expect(eventBus.emit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'x402_data_received',
      agent: 'data-worker',
      message: expect.stringContaining('Premium data received: 0 assets'),
    }));
  });
});
