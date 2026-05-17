let _isDemo = true;

jest.mock('@/lib/constants', () => ({
  get IS_DEMO() { return _isDemo; },
  X402_FACILITATOR: 'https://test-facilitator.example.com',
  X402_COST_PER_CALL: 0.01,
}));

import { verifyPayment, getPaymentRequirements, X402_COST_PER_CALL } from '@/lib/seller';

beforeEach(() => { _isDemo = true; });

describe('verifyPayment — demo mode', () => {
  it('accepts null signature', () => {
    expect(verifyPayment(null)).toBe(true);
  });

  it('accepts any non-null signature', () => {
    expect(verifyPayment('mock-sig')).toBe(true);
    expect(verifyPayment('0xdeadbeef')).toBe(true);
  });
});

describe('verifyPayment — live mode', () => {
  beforeEach(() => { _isDemo = false; });

  it('rejects null signature', () => {
    expect(verifyPayment(null)).toBe(false);
  });

  it('rejects any signature (stub returns false)', () => {
    expect(verifyPayment('valid-looking-sig')).toBe(false);
  });
});

describe('getPaymentRequirements', () => {
  it('returns PAYMENT-REQUIRED header', () => {
    const headers = getPaymentRequirements();
    expect(headers['PAYMENT-REQUIRED']).toBeDefined();
  });

  it('header is valid JSON', () => {
    const headers = getPaymentRequirements();
    expect(() => JSON.parse(headers['PAYMENT-REQUIRED'])).not.toThrow();
  });

  it('header contains required fields', () => {
    const headers = getPaymentRequirements();
    const parsed = JSON.parse(headers['PAYMENT-REQUIRED']);
    expect(parsed.scheme).toBe('erc7710-exact-evm');
    expect(parsed.network).toBe('ethereum-sepolia');
    expect(parsed.maxAmountRequired).toBeDefined();
    expect(parsed.facilitator).toBe('https://test-facilitator.example.com');
  });

  it('maxAmountRequired reflects X402_COST_PER_CALL in USDC raw units', () => {
    const headers = getPaymentRequirements();
    const parsed = JSON.parse(headers['PAYMENT-REQUIRED']);
    expect(parsed.maxAmountRequired).toBe(String(0.01 * 1e6));
  });
});

describe('re-exports', () => {
  it('exports X402_COST_PER_CALL', () => {
    expect(X402_COST_PER_CALL).toBe(0.01);
  });
});
