import { describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry } from '../knowledge/schema.ts';
import { pullman } from '../test/helpers.ts';
import {
  buildPrompt,
  DEEPSEEK_API_URL,
  DeepSeekApiError,
  DeepSeekResponder,
} from './deepseekResponder.ts';
import { BUTCH_SYSTEM_PROMPT } from './persona.ts';
import type { ResponderInput } from './types.ts';

/** A stand-in for fetch so tests never call the real (paid) API. */
function fakeFetch(...responses: Response[]) {
  const fn = vi.fn<typeof fetch>();
  for (const response of responses) fn.mockResolvedValueOnce(response);
  return fn;
}

function completion(finish_reason: string, content: string | null) {
  return Response.json({ choices: [{ finish_reason, message: { role: 'assistant', content } }] });
}

function sentBody(fn: ReturnType<typeof fakeFetch>, call = 0) {
  return JSON.parse(fn.mock.calls[call]![1]!.body as string);
}

const entry: KnowledgeEntry = {
  id: 'dining-southside-cafe',
  category: 'dining',
  title: 'Southside Café',
  content: 'Southside Café is a dining center.',
  keywords: [],
  links: [{ label: 'WSU Dining: Facility Hours', url: 'https://dining.wsu.edu/facility-hours/' }],
  lastVerified: '2026-09-25',
};

const input: ResponderInput = {
  question: 'Is Southside open?',
  history: [
    { role: 'assistant', text: 'Hi, I’m Butch!' },
    { role: 'user', text: 'Hello' },
    { role: 'assistant', text: 'Go Cougs!' },
  ],
  facts: [
    { entry, score: 1, liveStatus: 'Southside Café: open right now, closing at 9:00 PM today.' },
  ],
  now: pullman('2026-09-21 12:00'),
};

const options = { apiKey: 'test-key', model: 'deepseek-flash' };

describe('DeepSeekResponder', () => {
  it('sends the persona, history, and grounded facts, and returns the text', async () => {
    const fetch = fakeFetch(completion('stop', 'Yep, Southside is open until 9 PM!'));
    const responder = new DeepSeekResponder({ ...options, fetch });

    await expect(responder.respond(input)).resolves.toEqual({
      text: 'Yep, Southside is open until 9 PM!',
      answered: true,
    });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(DEEPSEEK_API_URL);
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer test-key');

    const body = sentBody(fetch);
    expect(body.model).toBe('deepseek-flash');
    expect(body.thinking).toEqual({ type: 'disabled' });
    expect(body.messages[0]).toEqual({ role: 'system', content: BUTCH_SYSTEM_PROMPT });
    // Leading assistant turns are dropped so the conversation starts with the user.
    expect(body.messages.slice(1).map((m: { role: string }) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
    ]);
    expect(body.messages.at(-1).content).toContain('Live status: Southside Café: open right now');
  });

  it('treats a content filter stop as "not answered" so Butch falls back', async () => {
    const fetch = fakeFetch(completion('content_filter', ''));
    const responder = new DeepSeekResponder({ ...options, fetch });
    await expect(responder.respond(input)).resolves.toEqual({ text: '', answered: false });
  });

  it('caps reply length and drops replies that get cut off', async () => {
    const fetch = fakeFetch(
      completion('length', 'Here is a 5,000-word essay about WSU. Chapter 1...'),
    );
    const responder = new DeepSeekResponder({ ...options, fetch });
    await expect(responder.respond(input)).resolves.toEqual({ text: '', answered: false });
    expect(sentBody(fetch).max_tokens).toBe(4096);
  });

  it('retries once on a server error, then succeeds', async () => {
    const fetch = fakeFetch(new Response('busy', { status: 503 }), completion('stop', 'Hi'));
    const responder = new DeepSeekResponder({ ...options, fetch });
    await expect(responder.respond(input)).resolves.toEqual({ text: 'Hi', answered: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws without retrying on a bad API key', async () => {
    const fetch = fakeFetch(new Response('unauthorized', { status: 401 }));
    const responder = new DeepSeekResponder({ ...options, fetch });
    await expect(responder.respond(input)).rejects.toBeInstanceOf(DeepSeekApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('buildPrompt', () => {
  it('puts the Pullman time, facts, and question in the user message', () => {
    const prompt = buildPrompt(input);
    expect(prompt).toContain(
      '<current_time>Monday, September 21, 2026 at 12:00 PM (Pullman, WA)</current_time>',
    );
    expect(prompt).toContain('<fact title="Southside Café" source="WSU Dining: Facility Hours">');
    expect(prompt).toContain('<question>Is Southside open?</question>');
  });
});
