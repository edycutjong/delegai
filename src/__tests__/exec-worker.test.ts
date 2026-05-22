import { runExecWorker } from '../agents/exec-worker';
import { getFeeData, sendTransaction } from '../lib/relay';
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

  it('runs the exec worker flow successfully without delegationId', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (sendTransaction as jest.Mock).mockResolvedValue({ taskId: 'task-123' });

    const result = await runExecWorker();

    expect(result).toEqual({ taskId: 'task-123', status: 'CONFIRMED', txHash: undefined });

    expect(getFeeData).toHaveBeenCalledTimes(1);
    expect(callVenice).toHaveBeenCalledTimes(1);
    expect(sendTransaction).toHaveBeenCalledTimes(1);

    expect(eventBus.emit).toHaveBeenCalledTimes(3);

    expect(eventBus.emit).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'ai_reasoning',
      agent: 'exec-worker',
      message: expect.stringContaining('Venice AI:'),
    }));

    expect(eventBus.emit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'relay_submitted',
      agent: 'exec-worker',
      message: expect.stringContaining('Submitting'),
    }));
  });

  it('submits encoded delegation chain when delegationId is provided', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (settleDelegationChain as jest.Mock).mockResolvedValue('0xsettledtxhash');

    const result = await runExecWorker('deleg-exec-id');

    expect(result).toEqual({ taskId: '0xsettledtxhash', status: 'CONFIRMED', txHash: '0xsettledtxhash' });
    expect(settleDelegationChain).toHaveBeenCalledWith('deleg-exec-id');
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it('handles undefined txHash from settleDelegationChain', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (settleDelegationChain as jest.Mock).mockResolvedValue(undefined);

    const result = await runExecWorker('deleg-demo-id');

    expect(result).toEqual({ taskId: 'direct', status: 'CONFIRMED', txHash: undefined });

    expect(eventBus.emit).toHaveBeenNthCalledWith(3, expect.objectContaining({
      type: 'relay_confirmed',
      message: expect.stringContaining('no tx hash'),
    }));
  });

  it('degrades gracefully when relay is not configured (code 4206)', async () => {
    (getFeeData as jest.Mock).mockRejectedValue(new Error('1Shot relay not configured: set ONESHOT_API_KEY and ONESHOT_API_SECRET'));

    const result = await runExecWorker();

    expect(result.taskId).toBe('unconfigured');
    expect(result.status).toBe('CONFIRMED');
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

  it('includes txHash in confirmed event metadata', async () => {
    (getFeeData as jest.Mock).mockResolvedValue({ feeAmount: '100000' });
    (settleDelegationChain as jest.Mock).mockResolvedValue('0xrealtxhash123456');

    await runExecWorker('deleg-id');

    expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'relay_confirmed',
      message: expect.stringContaining('redeemDelegations confirmed'),
      metadata: { txHash: '0xrealtxhash123456' },
    }));
  });

  it('re-throws unexpected errors from getFeeData', async () => {
    (getFeeData as jest.Mock).mockRejectedValue(new Error('network timeout'));

    await expect(runExecWorker()).rejects.toThrow('network timeout');

    expect(sendTransaction).not.toHaveBeenCalled();
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
