import { runOrchestration } from '../agents/orchestrator';
import { createDelegationWithCaveats, requestPermissions } from '../lib/delegator';
import { eventBus } from '../lib/events';

jest.mock('../lib/delegator');
jest.mock('../lib/events', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}));
jest.mock('../lib/constants', () => ({
  ...jest.requireActual('../lib/constants'),
  STEP_DELAY: 0,
}));

describe('Orchestrator Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs the orchestrator flow successfully', async () => {
    const mockRootDelegation = { id: 'root-1' };
    const mockDataDelegation = { id: 'sub-data-1' };
    const mockExecDelegation = { id: 'sub-exec-1' };

    (requestPermissions as jest.Mock).mockResolvedValue(mockRootDelegation);
    (createDelegationWithCaveats as jest.Mock)
      .mockResolvedValueOnce(mockDataDelegation)
      .mockResolvedValueOnce(mockExecDelegation);

    const result = await runOrchestration();

    expect(result).toEqual({
      root: mockRootDelegation,
      subDelegations: [mockDataDelegation, mockExecDelegation],
    });

    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(createDelegationWithCaveats).toHaveBeenCalledTimes(2);
    expect(eventBus.emit).toHaveBeenCalledTimes(4);
  });
});
