import {
  createMockAgents,
  createMockDelegationChain,
  createMockActivities,
  MOCK_FEE_DATA,
  MOCK_RELAY_SUBMISSION,
  MOCK_RELAY_STATUS,
  MOCK_MARKET_FEED,
  MOCK_DEFI_YIELDS,
} from '@/lib/mock-data';
import { ROOT_BUDGET_USDC, ROOT_MAX_CALLS } from '@/lib/constants';

describe('createMockAgents', () => {
  it('returns exactly 4 agents', () => {
    expect(createMockAgents()).toHaveLength(4);
  });

  it('covers all required roles', () => {
    const roles = createMockAgents().map((a) => a.role);
    expect(roles).toContain('user');
    expect(roles).toContain('master');
    expect(roles).toContain('data-worker');
    expect(roles).toContain('exec-worker');
  });

  it('all agents start idle', () => {
    createMockAgents().forEach((a) => expect(a.status).toBe('idle'));
  });

  it('user agent has root budget', () => {
    const user = createMockAgents().find((a) => a.role === 'user')!;
    expect(user.budget.allocated).toBe(ROOT_BUDGET_USDC);
    expect(user.budget.callsMax).toBe(ROOT_MAX_CALLS);
    expect(user.budget.consumed).toBe(0);
  });

  it('worker agents start with zero allocation', () => {
    createMockAgents()
      .filter((a) => ['data-worker', 'exec-worker'].includes(a.role))
      .forEach((w) => {
        expect(w.budget.allocated).toBe(0);
        expect(w.budget.consumed).toBe(0);
        expect(w.budget.callsMax).toBe(0);
      });
  });

  it('all agents have unique ids', () => {
    const ids = createMockAgents().map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all agents have addresses', () => {
    createMockAgents().forEach((a) => expect(a.address).toBeTruthy());
  });
});

describe('createMockDelegationChain', () => {
  it('has a root delegation', () => {
    const chain = createMockDelegationChain();
    expect(chain.root).toBeDefined();
    expect(chain.root.id).toBe('deleg-root-001');
  });

  it('has 2 sub-delegations', () => {
    const { subDelegations } = createMockDelegationChain();
    expect(subDelegations).toHaveLength(2);
  });

  it('sub-delegations reference root as parent', () => {
    const { subDelegations } = createMockDelegationChain();
    subDelegations.forEach((d) =>
      expect(d.parentDelegation).toBe('deleg-root-001')
    );
  });

  it('root has 50 USDC caveat in raw units', () => {
    const { root } = createMockDelegationChain();
    const caveat = root.caveats.find((c) => c.type === 'Erc20TransferAmount');
    expect(caveat?.value).toBe('50000000');
  });

  it('root has 5-call limit caveat', () => {
    const { root } = createMockDelegationChain();
    const caveat = root.caveats.find((c) => c.type === 'LimitedCalls');
    expect(caveat?.value).toBe(5);
  });

  it('root is active by default', () => {
    expect(createMockDelegationChain().root.status).toBe('active');
  });

  it('all delegations have signatures', () => {
    const chain = createMockDelegationChain();
    expect(chain.root.signature).toBeTruthy();
    chain.subDelegations.forEach((d) => expect(d.signature).toBeTruthy());
  });

  it('sub-delegations have Redeemer caveats', () => {
    const { subDelegations } = createMockDelegationChain();
    subDelegations.forEach((d) => {
      expect(d.caveats.some((c) => c.type === 'Redeemer')).toBe(true);
    });
  });
});

describe('createMockActivities', () => {
  it('returns 13 activity events', () => {
    expect(createMockActivities()).toHaveLength(13);
  });

  it('first event is delegation_created by user', () => {
    const [first] = createMockActivities();
    expect(first.type).toBe('delegation_created');
    expect(first.agent).toBe('user');
  });

  it('last event is chain_settled', () => {
    const events = createMockActivities();
    expect(events[events.length - 1].type).toBe('chain_settled');
  });

  it('all events have required fields', () => {
    createMockActivities().forEach((e) => {
      expect(e.id).toBeTruthy();
      expect(e.type).toBeTruthy();
      expect(e.agent).toBeTruthy();
      expect(e.message).toBeTruthy();
      expect(e.timestamp).toBeGreaterThan(0);
    });
  });

  it('events have strictly increasing timestamps', () => {
    const events = createMockActivities();
    for (let i = 1; i < events.length; i++) {
      expect(events[i].timestamp).toBeGreaterThan(events[i - 1].timestamp);
    }
  });
});

describe('mock relay fixtures', () => {
  it('MOCK_FEE_DATA has expected feeAmount', () => {
    expect(MOCK_FEE_DATA.feeAmount).toBe('30000');
  });

  it('MOCK_FEE_DATA expiry is in the future', () => {
    expect(MOCK_FEE_DATA.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('MOCK_RELAY_SUBMISSION is PENDING', () => {
    expect(MOCK_RELAY_SUBMISSION.status).toBe('PENDING');
    expect(MOCK_RELAY_SUBMISSION.taskId).toBeTruthy();
  });

  it('MOCK_RELAY_STATUS is CONFIRMED with txHash', () => {
    expect(MOCK_RELAY_STATUS.status).toBe('CONFIRMED');
    expect(MOCK_RELAY_STATUS.txHash).toBeTruthy();
  });
});

describe('mock premium data', () => {
  it('MOCK_MARKET_FEED has 3 assets', () => {
    expect((MOCK_MARKET_FEED as { assets?: unknown[] }).assets).toHaveLength(3);
  });

  it('MOCK_DEFI_YIELDS has 3 protocols', () => {
    expect((MOCK_DEFI_YIELDS as { protocols?: unknown[] }).protocols).toHaveLength(3);
  });

  it('MOCK_MARKET_FEED has source and cost', () => {
    expect(MOCK_MARKET_FEED.source).toBeTruthy();
    expect(MOCK_MARKET_FEED.cost).toBeTruthy();
  });
});
