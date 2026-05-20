import { runExecWorker } from '../agents/exec-worker';
import { getFeeData, sendTransaction, getStatus } from '../lib/relay';
import { settleDelegationChain } from '../lib/delegator';
import { callVenice } from '../lib/venice';
import { eventBus } from '../lib/events';

jest.mock('../lib/relay');
jest.mock('../lib/delegator');
jest.mock('../lib/venice', () => ({ callVenice: jest.fn() }));
jest.mock('../lib/events', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}));

describe('Exec Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (callVenice as jest.Mock).mockResolvedValue('Venice exec decision.');
  });

  it('runs the exec worker flow successfully', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (sendTransaction as jest.Mock).mockResolvedValue({ taskId: 'task-123' });
    (getStatus as jest.Mock).mockResolvedValue({ txHash: '0x1234567890abcdef1234567890abcdef12345678' });

    const result = await runExecWorker();

    expect(result).toEqual({ txHash: '0x1234567890abcdef1234567890abcdef12345678' });

    expect(getFeeData).toHaveBeenCalledTimes(1);
    expect(callVenice).toHaveBeenCalledTimes(1);
    expect(sendTransaction).toHaveBeenCalledTimes(1);
    expect(getStatus).toHaveBeenCalledWith('task-123');

    expect(eventBus.emit).toHaveBeenCalledTimes(3);

    expect(eventBus.emit).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'ai_reasoning',
      agent: 'exec-worker',
      message: expect.stringContaining('Venice AI:'),
    }));

    expect(eventBus.emit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'relay_submitted',
      agent: 'exec-worker',
      message: expect.stringContaining('Gwei'),
    }));

    expect(eventBus.emit).toHaveBeenNthCalledWith(3, expect.objectContaining({
      type: 'relay_confirmed',
      agent: 'exec-worker',
      message: expect.stringContaining('1Shot relay confirmed: tx'),
    }));
  });

  it('submits encoded delegation chain when delegationId is provided', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (settleDelegationChain as jest.Mock).mockResolvedValue('task-settled');
    (getStatus as jest.Mock).mockResolvedValue({ txHash: '0xsettled' });

    const result = await runExecWorker('deleg-exec-id');

    expect(result).toEqual({ txHash: '0xsettled' });
    expect(settleDelegationChain).toHaveBeenCalledWith('deleg-exec-id');
    expect(getStatus).toHaveBeenCalledWith('task-settled');
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it('falls back to "unknown" taskId when settleDelegationChain returns undefined', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (settleDelegationChain as jest.Mock).mockResolvedValue(undefined);
    (getStatus as jest.Mock).mockResolvedValue({ txHash: '0xfallback' });

    const result = await runExecWorker('deleg-demo-id');

    expect(result).toEqual({ txHash: '0xfallback' });
    expect(getStatus).toHaveBeenCalledWith('unknown');
  });

  it('degrades gracefully when relay is not configured (code 4206)', async () => {
    (getFeeData as jest.Mock).mockRejectedValue(new Error('1Shot relay not configured: set ONESHOT_API_KEY and ONESHOT_API_SECRET'));

    const result = await runExecWorker();

    expect(result.taskId).toBe('unconfigured');
    expect(result.status).toBe('CONFIRMED');
    expect(getStatus).not.toHaveBeenCalled();
    expect(sendTransaction).not.toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledTimes(2);
    expect(eventBus.emit).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'relay_submitted',
      message: expect.stringContaining('relay skipped'),
    }));
    expect(eventBus.emit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'relay_confirmed',
      message: expect.stringContaining('relay unconfigured'),
    }));
  });

  it('handles undefined txHash', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (sendTransaction as jest.Mock).mockResolvedValue({ taskId: 'task-123' });
    (getStatus as jest.Mock).mockResolvedValue({ status: 'PENDING' }); // No txHash

    const result = await runExecWorker();

    expect(result).toEqual({ status: 'PENDING' });

    expect(eventBus.emit).toHaveBeenNthCalledWith(3, expect.objectContaining({
      type: 'relay_confirmed',
      agent: 'exec-worker',
      message: expect.stringContaining('1Shot relay confirmed'),
    }));
  });

  it('re-throws unexpected errors from getFeeData', async () => {
    (getFeeData as jest.Mock).mockRejectedValue(new Error('network timeout'));

    await expect(runExecWorker()).rejects.toThrow('network timeout');

    expect(sendTransaction).not.toHaveBeenCalled();
    expect(getStatus).not.toHaveBeenCalled();
  });

  it('re-throws non-Error objects from getFeeData', async () => {
    (getFeeData as jest.Mock).mockRejectedValue('raw string error');

    await expect(runExecWorker()).rejects.toBe('raw string error');
  });

  it('degrades gracefully when relay throws "Chain undefined"', async () => {
    (getFeeData as jest.Mock).mockRejectedValue(new Error('Chain undefined for environment'));

    const result = await runExecWorker();

    expect(result.taskId).toBe('unconfigured');
    expect(result.status).toBe('CONFIRMED');
  });
});
