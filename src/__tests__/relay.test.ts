import { getFeeData, sendTransaction, getStatus } from '../lib/relay';
import { MOCK_FEE_DATA, MOCK_RELAY_SUBMISSION, MOCK_RELAY_STATUS } from '../lib/mock-data';
import * as constants from '../lib/constants';

describe('Relay Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('getFeeData fetches fee from ONESHOT_ENDPOINT', async () => {
    const mockResult = { feeAmount: '100', feeToken: 'USDC' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ result: mockResult }),
    });

    const data = await getFeeData();
    expect(data).toEqual(mockResult);
    expect(global.fetch).toHaveBeenCalledWith(constants.ONESHOT_ENDPOINT, expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('relayer_getFeeData'),
    }));
  });

  it('sendTransaction sends tx to ONESHOT_ENDPOINT', async () => {
    const mockResult = { taskId: 'task-1' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ result: mockResult }),
    });

    const data = await sendTransaction('0x123');
    expect(data).toEqual(mockResult);
    expect(global.fetch).toHaveBeenCalledWith(constants.ONESHOT_ENDPOINT, expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('relayer_send7710Transaction'),
    }));
  });

  it('getStatus polls ONESHOT_ENDPOINT', async () => {
    const mockResult = { taskId: 'task-1', status: 'CONFIRMED' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ result: mockResult }),
    });

    const data = await getStatus('task-1');
    expect(data).toEqual(mockResult);
    expect(global.fetch).toHaveBeenCalledWith(constants.ONESHOT_ENDPOINT, expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('relayer_getStatus'),
    }));
  });

  it('getFeeData returns mock fee when IS_DEMO is true', async () => {
    jest.resetModules();
    jest.doMock('../lib/constants', () => ({
      ...jest.requireActual('../lib/constants'),
      IS_DEMO: true
    }));
    const { getFeeData } = require('../lib/relay');
    const result = await getFeeData();
    expect(result.feeAmount).toBe('30000');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sendTransaction returns mock submission when IS_DEMO is true', async () => {
    jest.resetModules();
    jest.doMock('../lib/constants', () => ({
      ...jest.requireActual('../lib/constants'),
      IS_DEMO: true
    }));
    const { sendTransaction } = require('../lib/relay');
    const result = await sendTransaction('0x123');
    expect(result.status).toBe('PENDING');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('getStatus returns mock status when IS_DEMO is true', async () => {
    jest.resetModules();
    jest.doMock('../lib/constants', () => ({
      ...jest.requireActual('../lib/constants'),
      IS_DEMO: true
    }));
    const { getStatus } = require('../lib/relay');
    const result = await getStatus('task-123');
    expect(result.status).toBe('CONFIRMED');
    expect(result.txHash).toBeDefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
