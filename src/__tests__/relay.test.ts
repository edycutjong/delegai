const mockFetch = jest.fn();
beforeAll(() => { global.fetch = mockFetch as unknown as typeof fetch; });
beforeEach(() => { mockFetch.mockReset(); });

function loadRelay(IS_DEMO: boolean) {
  let mod: typeof import('../lib/relay');
  jest.isolateModules(() => {
    jest.doMock('../lib/constants', () => ({
      ...jest.requireActual('../lib/constants'),
      IS_DEMO,
      ONESHOT_ENDPOINT: 'https://test-relay.example.com',
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../lib/relay');
  });
  return mod!;
}

describe('demo mode', () => {
  it('getFeeData returns mock fee data', async () => {
    const relay = loadRelay(true);
    const data = await relay.getFeeData();
    expect(data.feeAmount).toBe('30000');
    expect(data.feeToken).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sendTransaction returns mock submission', async () => {
    const relay = loadRelay(true);
    const data = await relay.sendTransaction();
    expect(data.status).toBe('PENDING');
    expect(data.taskId).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('getStatus returns mock status with provided taskId', async () => {
    const relay = loadRelay(true);
    const data = await relay.getStatus('task-123');
    expect(data.status).toBe('CONFIRMED');
    expect(data.taskId).toBe('task-123');
    expect(data.txHash).toBeDefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('live mode', () => {
  it('getFeeData posts relayer_getFeeData and returns result', async () => {
    const result = { feeToken: '0xusdc', feeAmount: '30000', expiresAt: 9999 };
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ result }) });
    const relay = loadRelay(false);
    const data = await relay.getFeeData();
    expect(data).toEqual(result);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe('relayer_getFeeData');
    expect(mockFetch.mock.calls[0][0]).toBe('https://test-relay.example.com');
  });

  it('sendTransaction posts relayer_send7710Transaction and returns result', async () => {
    const result = { taskId: 'task-live-1', status: 'PENDING' };
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ result }) });
    const relay = loadRelay(false);
    const data = await relay.sendTransaction();
    expect(data).toEqual(result);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe('relayer_send7710Transaction');
    expect(body.params).toEqual([]);
  });

  it('sendTransaction includes encoded delegations in params when provided', async () => {
    const result = { taskId: 'task-live-2', status: 'PENDING' };
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ result }) });
    const relay = loadRelay(false);
    const data = await relay.sendTransaction({ encodedDelegations: '0xencoded' });
    expect(data).toEqual(result);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.params).toEqual([{ delegations: '0xencoded' }]);
  });

  it('getStatus posts relayer_getStatus with taskId and returns result', async () => {
    const result = { taskId: 'task-1', status: 'CONFIRMED', txHash: '0xabc' };
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ result }) });
    const relay = loadRelay(false);
    const data = await relay.getStatus('task-1');
    expect(data).toEqual(result);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe('relayer_getStatus');
    expect(body.params[0].taskId).toBe('task-1');
  });

  it('getFeeData throws on JSON-RPC error response', async () => {
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ error: { message: 'rate limited' } }) });
    const relay = loadRelay(false);
    await expect(relay.getFeeData()).rejects.toThrow('rate limited');
  });

  it('sendTransaction throws on JSON-RPC error response', async () => {
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ error: { message: 'insufficient funds' } }) });
    const relay = loadRelay(false);
    await expect(relay.sendTransaction()).rejects.toThrow('insufficient funds');
  });

  it('getStatus throws on JSON-RPC error response', async () => {
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ error: { message: 'task not found' } }) });
    const relay = loadRelay(false);
    await expect(relay.getStatus('bad-id')).rejects.toThrow('task not found');
  });

  it('getFeeData throws fallback message when error has no message field', async () => {
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ error: {} }) });
    const relay = loadRelay(false);
    await expect(relay.getFeeData()).rejects.toThrow('relayer_getFeeData failed');
  });

  it('sendTransaction throws fallback message when error has no message field', async () => {
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ error: {} }) });
    const relay = loadRelay(false);
    await expect(relay.sendTransaction()).rejects.toThrow('relayer_send7710Transaction failed');
  });

  it('getStatus throws fallback message when error has no message field', async () => {
    mockFetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ error: {} }) });
    const relay = loadRelay(false);
    await expect(relay.getStatus('x')).rejects.toThrow('relayer_getStatus failed');
  });
});
