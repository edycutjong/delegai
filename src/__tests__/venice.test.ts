import { callVenice, VENICE_MODEL } from '../lib/venice';

let _isDemo = false;

jest.mock('../lib/constants', () => ({
  get IS_DEMO() { return _isDemo; },
}));

const MESSAGES = [
  { role: 'system' as const, content: 'You are a test agent.' },
  { role: 'user' as const, content: 'Say hello.' },
];
const FALLBACK = 'demo fallback response';

describe('Venice AI client', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    _isDemo = false;
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it('returns demoFallback immediately in demo mode without calling fetch', async () => {
    _isDemo = true;
    const result = await callVenice(MESSAGES, FALLBACK);
    expect(result).toBe(FALLBACK);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns demoFallback when VENICE_API_KEY is not set', async () => {
    delete process.env.VENICE_API_KEY;
    const result = await callVenice(MESSAGES, FALLBACK);
    expect(result).toBe(FALLBACK);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls Venice API and returns content when key is set and response is ok', async () => {
    process.env.VENICE_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '  Venice says hello  ' } }],
      }),
    });

    const result = await callVenice(MESSAGES, FALLBACK);

    expect(result).toBe('Venice says hello');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.venice.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining(VENICE_MODEL),
      })
    );
  });

  it('returns demoFallback when response has no content', async () => {
    process.env.VENICE_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const result = await callVenice(MESSAGES, FALLBACK);
    expect(result).toBe(FALLBACK);
  });

  it('returns demoFallback when Venice returns 402 (out of credits)', async () => {
    process.env.VENICE_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 402,
      statusText: 'Payment Required',
    });

    const result = await callVenice(MESSAGES, FALLBACK);
    expect(result).toBe(FALLBACK);
  });

  it('returns demoFallback when Venice returns 429 (rate limited)', async () => {
    process.env.VENICE_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    const result = await callVenice(MESSAGES, FALLBACK);
    expect(result).toBe(FALLBACK);
  });

  it('throws when Venice API returns other non-ok status (e.g. 500)', async () => {
    process.env.VENICE_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(callVenice(MESSAGES, FALLBACK)).rejects.toThrow('Venice API error: 500');
  });

  it('returns demoFallback when choices message content is undefined', async () => {
    process.env.VENICE_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: {} }] }),
    });

    const result = await callVenice(MESSAGES, FALLBACK);
    expect(result).toBe(FALLBACK);
  });

  it('returns demoFallback when choices key is missing from response', async () => {
    process.env.VENICE_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await callVenice(MESSAGES, FALLBACK);
    expect(result).toBe(FALLBACK);
  });

  it('uses VENICE_MODEL env var when set', () => {
    let model: string | undefined;
    jest.isolateModules(() => {
      process.env.VENICE_MODEL = 'custom-model-test';
      jest.mock('../lib/constants', () => ({ get IS_DEMO() { return false; } }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const m = require('../lib/venice') as { VENICE_MODEL: string };
      model = m.VENICE_MODEL;
      delete process.env.VENICE_MODEL;
    });
    expect(model).toBe('custom-model-test');
  });

  it('exports VENICE_MODEL as a non-empty string', () => {
    expect(typeof VENICE_MODEL).toBe('string');
    expect(VENICE_MODEL.length).toBeGreaterThan(0);
  });
});
