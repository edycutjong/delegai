const mockFetch = jest.fn();
beforeAll(() => { global.fetch = mockFetch as unknown as typeof fetch; });
beforeEach(() => {
  mockFetch.mockReset();
  process.env.ONESHOT_API_KEY = 'test-key';
  process.env.ONESHOT_API_SECRET = 'test-secret';
});
afterEach(() => {
  delete process.env.ONESHOT_API_KEY;
  delete process.env.ONESHOT_API_SECRET;
  delete process.env.ONESHOT_CONTRACT_METHOD_ID;
});

function loadRelay(IS_DEMO: boolean) {
  let mod: typeof import('../lib/relay');
  jest.isolateModules(() => {
    jest.doMock('../lib/constants', () => ({
      ...jest.requireActual('../lib/constants'),
      IS_DEMO,
      CHAIN_ID: 11155111,
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../lib/relay');
  });
  return mod!;
}

function mockToken() {
  mockFetch.mockResolvedValueOnce({
    json: jest.fn().mockResolvedValue({ access_token: 'mock-token', expires_in: 3600 }),
    ok: true,
  });
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
  it('getFeeData fetches OAuth2 token then gets chain fees', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ effectiveGasPrice: '5000000000' }),
    });
    const relay = loadRelay(false);
    const data = await relay.getFeeData();
    expect(data.feeToken).toBe('ETH');
    expect(data.feeAmount).toBe('5000000000');
    expect(data.expiresAt).toBeGreaterThan(0);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const tokenBody = mockFetch.mock.calls[0][1].body;
    expect(tokenBody).toContain('grant_type=client_credentials');
    expect(mockFetch.mock.calls[1][0]).toContain('/chains/11155111/fees');
  });

  it('sendTransaction returns pending immediately when ONESHOT_CONTRACT_METHOD_ID is not set', async () => {
    const relay = loadRelay(false);
    const result = await relay.sendTransaction({ encodedDelegations: '0xencoded' });
    expect(result.taskId).toBe('no-method-configured');
    expect(result.status).toBe('PENDING');
    // No fetches — returns early without needing a token
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sendTransaction calls executeAsDelegator when ONESHOT_CONTRACT_METHOD_ID is set', async () => {
    process.env.ONESHOT_CONTRACT_METHOD_ID = 'method-uuid-123';
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-abc', status: 'Pending' }),
    });
    const relay = loadRelay(false);
    const data = await relay.sendTransaction({ encodedDelegations: '0xdeleg' });
    expect(data.taskId).toBe('tx-abc');
    expect(data.status).toBe('PENDING');
    expect(mockFetch.mock.calls[1][0]).toContain('/methods/method-uuid-123/execute');
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.params._permissionContexts).toEqual(['0xdeleg']);
    expect(body.params._modes).toHaveLength(1);
    expect(body.params._executionCallDatas).toHaveLength(1);
  });

  it('getStatus maps Completed to CONFIRMED', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-1', status: 'Completed', transactionHash: '0xabc' }),
    });
    const relay = loadRelay(false);
    const data = await relay.getStatus('tx-1');
    expect(data.status).toBe('CONFIRMED');
    expect(data.txHash).toBe('0xabc');
  });

  it('getStatus maps Failed to FAILED', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-2', status: 'Failed' }),
    });
    const relay = loadRelay(false);
    const data = await relay.getStatus('tx-2');
    expect(data.status).toBe('FAILED');
  });

  it('getStatus maps Pending/Submitted/Retrying to PENDING', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-3', status: 'Submitted' }),
    });
    const relay = loadRelay(false);
    const data = await relay.getStatus('tx-3');
    expect(data.status).toBe('PENDING');
  });

  it('getStatus returns CONFIRMED immediately for placeholder taskIds', async () => {
    const relay = loadRelay(false);
    expect((await relay.getStatus('no-method-configured')).status).toBe('CONFIRMED');
    expect((await relay.getStatus('unknown')).status).toBe('CONFIRMED');
    expect((await relay.getStatus('unconfigured')).status).toBe('CONFIRMED');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('getFeeData throws when ONESHOT_API_KEY is missing', async () => {
    delete process.env.ONESHOT_API_KEY;
    const relay = loadRelay(false);
    await expect(relay.getFeeData()).rejects.toThrow('1Shot relay not configured');
  });

  it('getFeeData throws when ONESHOT_API_SECRET is missing', async () => {
    delete process.env.ONESHOT_API_SECRET;
    const relay = loadRelay(false);
    await expect(relay.getFeeData()).rejects.toThrow('1Shot relay not configured');
  });

  it('getFeeData throws on auth failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Invalid API credential' }),
    });
    const relay = loadRelay(false);
    await expect(relay.getFeeData()).rejects.toThrow('1Shot auth failed');
  });

  it('getFeeData throws when fee endpoint returns error', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'chain not found' }),
    });
    const relay = loadRelay(false);
    await expect(relay.getFeeData()).rejects.toThrow('getFeeData failed');
  });

  it('sendTransaction throws when method call fails', async () => {
    process.env.ONESHOT_CONTRACT_METHOD_ID = 'method-uuid';
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'method not found' }),
    });
    const relay = loadRelay(false);
    await expect(relay.sendTransaction()).rejects.toThrow('sendTransaction failed');
  });

  it('getStatus throws when transaction endpoint returns error', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'not found' }),
    });
    const relay = loadRelay(false);
    await expect(relay.getStatus('real-tx-id')).rejects.toThrow('getStatus failed');
  });

  it('reuses cached token on subsequent calls', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ effectiveGasPrice: '1000' }),
    });
    // Second call — no new token fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ effectiveGasPrice: '2000' }),
    });
    const relay = loadRelay(false);
    await relay.getFeeData();
    await relay.getFeeData();
    // Token fetch only once, fee fetches twice = 3 total
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('auth failure without message field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({}),
    });
    const relay = loadRelay(false);
    await expect(relay.getFeeData()).rejects.toThrow('invalid credentials');
  });

  it('auth response without expires_in defaults to 3600s', async () => {
    mockFetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ access_token: 'tok' }),
      ok: true,
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ effectiveGasPrice: '500' }),
    });
    const relay = loadRelay(false);
    const data = await relay.getFeeData();
    expect(data.feeAmount).toBe('500');
  });

  it('getFeeData defaults feeAmount to "0" when effectiveGasPrice is missing', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });
    const relay = loadRelay(false);
    const data = await relay.getFeeData();
    expect(data.feeAmount).toBe('0');
  });

  it('getFeeData error without message field uses status code', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });
    const relay = loadRelay(false);
    await expect(relay.getFeeData()).rejects.toThrow('getFeeData failed: 500');
  });

  it('sendTransaction response without id defaults to "unknown"', async () => {
    process.env.ONESHOT_CONTRACT_METHOD_ID = 'method-uuid';
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'Pending' }),
    });
    const relay = loadRelay(false);
    const data = await relay.sendTransaction();
    expect(data.taskId).toBe('unknown');
  });

  it('sendTransaction error without message field uses status code', async () => {
    process.env.ONESHOT_CONTRACT_METHOD_ID = 'method-uuid';
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: jest.fn().mockResolvedValue({}),
    });
    const relay = loadRelay(false);
    await expect(relay.sendTransaction()).rejects.toThrow('sendTransaction failed: 422');
  });

  it('getStatus error without message field uses status code', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({}),
    });
    const relay = loadRelay(false);
    await expect(relay.getStatus('real-id')).rejects.toThrow('getStatus failed: 404');
  });

  it('getStatus defaults id and status when response fields are missing', async () => {
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });
    const relay = loadRelay(false);
    const data = await relay.getStatus('task-x');
    expect(data.taskId).toBe('task-x');
    expect(data.status).toBe('PENDING');
  });

  it('sendTransaction includes callbackUrl when ONESHOT_WEBHOOK_URL is set', async () => {
    process.env.ONESHOT_CONTRACT_METHOD_ID = 'method-uuid';
    process.env.ONESHOT_WEBHOOK_URL = 'https://my-app.vercel.app/api/relay/webhook';
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-webhook' }),
    });
    const relay = loadRelay(false);
    await relay.sendTransaction();
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.callbackUrl).toBe('https://my-app.vercel.app/api/relay/webhook');
    delete process.env.ONESHOT_WEBHOOK_URL;
  });

  it('sendTransaction omits callbackUrl when ONESHOT_WEBHOOK_URL is not set', async () => {
    process.env.ONESHOT_CONTRACT_METHOD_ID = 'method-uuid';
    delete process.env.ONESHOT_WEBHOOK_URL;
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-no-webhook' }),
    });
    const relay = loadRelay(false);
    await relay.sendTransaction();
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.callbackUrl).toBeUndefined();
  });

  it('sendTransaction sends empty permissionContexts when encodedDelegations is undefined', async () => {
    process.env.ONESHOT_CONTRACT_METHOD_ID = 'method-uuid';
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-no-deleg' }),
    });
    const relay = loadRelay(false);
    await relay.sendTransaction();
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.params._permissionContexts).toEqual([]);
  });

  it('sendTransaction uses provided executionCalldata and falls back to 52-byte no-op', async () => {
    process.env.ONESHOT_CONTRACT_METHOD_ID = 'method-uuid';
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-exec' }),
    });
    const relay = loadRelay(false);
    const customCalldata = '0xdeadbeef';
    await relay.sendTransaction({ executionCalldata: customCalldata });
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.params._executionCallDatas[0]).toBe(customCalldata);

    // Also verify the no-op fallback is ≥52 bytes (104 hex chars + '0x' prefix)
    mockToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'tx-noop' }),
    });
    await relay.sendTransaction();
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const body2 = JSON.parse(lastCall[1].body);
    const noopCalldata = body2.params._executionCallDatas[0] as string;
    expect(noopCalldata.startsWith('0x')).toBe(true);
    expect((noopCalldata.length - 2) / 2).toBeGreaterThanOrEqual(52);
  });
});
