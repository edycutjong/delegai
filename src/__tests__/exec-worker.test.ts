import { runExecWorker } from '../agents/exec-worker';
import { getFeeData, sendTransaction, getStatus } from '../lib/relay';
import { eventBus } from '../lib/events';

jest.mock('../lib/relay');
jest.mock('../lib/events', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}));

describe('Exec Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs the exec worker flow successfully', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (sendTransaction as jest.Mock).mockResolvedValue({ taskId: 'task-123' });
    (getStatus as jest.Mock).mockResolvedValue({ txHash: '0x1234567890abcdef1234567890abcdef12345678' });

    const result = await runExecWorker();

    expect(result).toEqual({ txHash: '0x1234567890abcdef1234567890abcdef12345678' });
    
    expect(getFeeData).toHaveBeenCalledTimes(1);
    expect(sendTransaction).toHaveBeenCalledTimes(1);
    expect(getStatus).toHaveBeenCalledWith('task-123');

    expect(eventBus.emit).toHaveBeenCalledTimes(2);

    expect(eventBus.emit).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'relay_submitted',
      agent: 'exec-worker',
      message: expect.stringContaining('UserOp submitted'),
    }));

    expect(eventBus.emit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'relay_confirmed',
      agent: 'exec-worker',
      message: expect.stringContaining('1Shot relay confirmed: tx'),
    }));
  });

  it('handles undefined txHash', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (sendTransaction as jest.Mock).mockResolvedValue({ taskId: 'task-123' });
    (getStatus as jest.Mock).mockResolvedValue({ status: 'PENDING' }); // No txHash

    const result = await runExecWorker();

    expect(result).toEqual({ status: 'PENDING' });
    
    expect(eventBus.emit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'relay_confirmed',
      agent: 'exec-worker',
      message: expect.stringContaining('1Shot relay confirmed: tx undefined...undefined'),
    }));
  });
});
