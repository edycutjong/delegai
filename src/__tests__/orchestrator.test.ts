import { runOrchestration } from '../agents/orchestrator';
import { createDelegationWithCaveats, requestPermissions, createSmartAccount } from '../lib/delegator';
import { eventBus } from '../lib/events';

let _isDemo = false;

jest.mock('../lib/delegator');
jest.mock('../lib/events', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}));
jest.mock('../lib/constants', () => ({
  get IS_DEMO() { return _isDemo; },
  DEMO_ADDRESSES: {
    master: '0xMa5t3R00000000000000000000000000000dEaD2',
    dataWorker: '0xDa7a000000000000000000000000000000dEaD3',
    execWorker: '0x3x3c000000000000000000000000000000dEaD4',
  },
  WORKER_BUDGET_USDC: 10,
  WORKER_MAX_CALLS: 2,
  STEP_DELAY: 0,
  toUsdcRaw: (n: number) => String(Math.round(n * 1e6)),
}));

describe('Orchestrator Worker', () => {
  beforeEach(() => {
    _isDemo = false;
    jest.clearAllMocks();
    (createSmartAccount as jest.Mock).mockResolvedValue('0xliveaddr');
    (requestPermissions as jest.Mock).mockResolvedValue({ id: 'root-1' });
    (createDelegationWithCaveats as jest.Mock)
      .mockResolvedValueOnce({ id: 'sub-data-1' })
      .mockResolvedValueOnce({ id: 'sub-exec-1' });
  });

  it('runs the orchestrator flow in live mode resolving real addresses', async () => {
    const result = await runOrchestration();

    expect(result).toEqual({
      root: { id: 'root-1' },
      subDelegations: [{ id: 'sub-data-1' }, { id: 'sub-exec-1' }],
    });

    expect(createSmartAccount).toHaveBeenCalledWith('master');
    expect(createSmartAccount).toHaveBeenCalledWith('data-worker');
    expect(createSmartAccount).toHaveBeenCalledWith('exec-worker');
    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(createDelegationWithCaveats).toHaveBeenCalledTimes(2);
    expect(eventBus.emit).toHaveBeenCalledTimes(4);
  });

  it('runs the orchestrator flow in demo mode using DEMO_ADDRESSES', async () => {
    _isDemo = true;
    (createDelegationWithCaveats as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce({ id: 'sub-data-1' })
      .mockResolvedValueOnce({ id: 'sub-exec-1' });

    const result = await runOrchestration();

    expect(result.root).toEqual({ id: 'root-1' });
    expect(result.subDelegations).toHaveLength(2);
    // createSmartAccount should NOT be called in demo mode
    expect(createSmartAccount).not.toHaveBeenCalled();
    // delegator calls with demo addresses
    expect(createDelegationWithCaveats).toHaveBeenCalledWith(
      expect.objectContaining({
        delegator: '0xMa5t3R00000000000000000000000000000dEaD2',
      })
    );
  });

  it('uses ONESHOT_WALLET_ADDRESS as exec delegate in live mode when set', async () => {
    process.env.ONESHOT_WALLET_ADDRESS = '0x1ShotWalletAddr';
    (createDelegationWithCaveats as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce({ id: 'sub-data-2' })
      .mockResolvedValueOnce({ id: 'sub-exec-2' });

    const result = await runOrchestration();

    expect(result.subDelegations).toHaveLength(2);
    // The second createDelegationWithCaveats call (exec worker) should use the 1Shot wallet address
    expect(createDelegationWithCaveats).toHaveBeenCalledWith(
      expect.objectContaining({
        delegate: '0x1ShotWalletAddr',
      })
    );

    delete process.env.ONESHOT_WALLET_ADDRESS;
  });
});
