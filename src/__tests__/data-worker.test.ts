import { runDataWorker } from '../agents/data-worker';
import { fetchPremiumData } from '../lib/buyer';
import { eventBus } from '../lib/events';

jest.mock('../lib/buyer');
jest.mock('../lib/events', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}));

describe('Data Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs the data worker flow successfully', async () => {
    const mockData = { assets: ['asset1', 'asset2'] };
    (fetchPremiumData as jest.Mock).mockResolvedValue(mockData);

    const result = await runDataWorker();

    expect(result).toEqual(mockData);
    expect(fetchPremiumData).toHaveBeenCalledWith('market-feed');
    expect(eventBus.emit).toHaveBeenCalledTimes(2);
    
    // First emission
    expect(eventBus.emit).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'x402_payment_sent',
      agent: 'data-worker',
      message: expect.stringContaining('x402 payment:'),
    }));
    
    // Second emission
    expect(eventBus.emit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'x402_data_received',
      agent: 'data-worker',
      message: expect.stringContaining('Premium data received: 2 assets'),
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
