/* ─────────────────────────────────────────────────────────
 * DelegAI — Venice AI Client
 * Privacy-first LLM inference via api.venice.ai
 * OpenAI-compatible API — used as core agent intelligence
 * ───────────────────────────────────────────────────────── */

import { IS_DEMO } from './constants';

const VENICE_API_BASE = 'https://api.venice.ai/api/v1';
export const VENICE_MODEL = process.env.VENICE_MODEL ?? 'llama-3.3-70b';

export interface VeniceMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Call Venice AI for agent reasoning.
 *
 * Demo mode: returns demoFallback immediately — no network call, no API key needed.
 * Live mode without VENICE_API_KEY: returns demoFallback gracefully.
 * Live mode with key: calls Venice OpenAI-compatible chat completions endpoint.
 */
export async function callVenice(
  messages: VeniceMessage[],
  demoFallback: string
): Promise<string> {
  if (IS_DEMO) return demoFallback;

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) return demoFallback;

  const res = await fetch(`${VENICE_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: VENICE_MODEL, messages, max_tokens: 150 }),
  });

  if (!res.ok) {
    // 402 = out of credits, 429 = rate limited — degrade gracefully rather than crash
    if (res.status === 402 || res.status === 429) return demoFallback;
    throw new Error(`Venice API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || demoFallback;
}
