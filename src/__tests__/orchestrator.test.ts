import { runOrchestration } from '../agents/orchestrator';
import { createDelegationWithCaveats, requestPermissions, createSmartAccount, createEip7702Authorization } from '../lib/delegator';
import { callVenice } from '../lib/venice';
import { eventBus } from '../lib/events';

let _isDemo = false;

jest.mock('../lib/delegator');
jest.mock('../lib/venice', () => ({ callVenice: jest.fn() }));
jest.mock('../lib/events', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}));
jest.mock('../lib/constants', () => ({
  get IS_DEMO() { return _isDemo; },
  DEMO_ADDRESSES: {
    user: '0xAl1c3000000000000000000000000000000dEaD1',
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
    (callVenice as jest.Mock).mockResolvedValue('Venice budget reasoning.');
    (createEip7702Authorization as jest.Mock).mockResolvedValue({
      contractAddress: '0x0000000000000000000000000000000000000001',
      chainId: 11155111,
      nonce: 0,
      r: '0x01',
      s: '0x01',
      yParity: 0,
    });
  });

  it('runs the orchestrator flow in live mode resolving real addresses', async () => {
    const result = await runOrchestration();

    expect(result).toEqual({
      root: { id: 'root-1' },
      subDelegations: [{ id: 'sub-data-1' }, { id: 'sub-exec-1' }],
    });

    expect(createSmartAccount).toHaveBeenCalledWith('user');
    expect(createSmartAccount).toHaveBeenCalledWith('master');
    expect(createSmartAccount).toHaveBeenCalledWith('data-worker');
    expect(createSmartAccount).toHaveBeenCalledWith('exec-worker');
    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(createDelegationWithCaveats).toHaveBeenCalledTimes(2);
    expect(callVenice).toHaveBeenCalledTimes(1);
    expect(createEip7702Authorization).toHaveBeenCalledWith('exec-worker');
    expect(eventBus.emit).toHaveBeenCalledTimes(7);
    expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'addresses_resolved',
      agent: 'master',
      metadata: expect.objectContaining({
        user: expect.any(String),
        master: expect.any(String),
        'data-worker': expect.any(String),
        'exec-worker': expect.any(String),
      }),
    }));
    expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ai_reasoning',
      agent: 'master',
      message: expect.stringContaining('Venice AI:'),
    }));
    expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'delegation_created',
      agent: 'master',
      message: expect.stringContaining('EIP-7702'),
    }));
  });

  it('runs the orchestrator flow in demo mode using DEMO_ADDRESSES', async () => {
    _isDemo = true;
    (createDelegationWithCaveats as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce({ id: 'sub-data-1' })
      .mockResolvedValueOnce({ id: 'sub-exec-1' });
    (callVenice as jest.Mock).mockReset().mockResolvedValue('Demo Venice reasoning.');
    (createEip7702Authorization as jest.Mock).mockReset().mockResolvedValue({ contractAddress: '0x01', chainId: 11155111, nonce: 0, r: '0x01', s: '0x01', yParity: 0 });

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
    (callVenice as jest.Mock).mockReset().mockResolvedValue('Venice reasoning.');
    (createEip7702Authorization as jest.Mock).mockReset().mockResolvedValue({ contractAddress: '0x01', chainId: 11155111, nonce: 0, r: '0x01', s: '0x01', yParity: 0 });

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
