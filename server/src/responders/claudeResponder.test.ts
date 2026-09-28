import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry } from '../knowledge/schema.ts';
import { pullman } from '../test/helpers.ts';
import { buildPrompt, ClaudeResponder } from './claudeResponder.ts';
import { BUTCH_SYSTEM_PROMPT } from './persona.ts';
import type { ResponderInput } from './types.ts';

/** A stand-in for the Anthropic client so tests never call the real (paid) API. */
function fakeClient(response: { stop_reason: string; content: { type: string; text?: string }[] }) {
  const create = vi.fn().mockResolvedValue(response);
  const client = { beta: { messages: { create } } } as unknown as Pick<Anthropic, 'beta'>;
  return { client, create };
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

describe('ClaudeResponder', () => {
  it('sends the persona, history, and grounded facts, and returns the text', async () => {
    const { client, create } = fakeClient({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'Yep, Southside is open until 9 PM!' }],
    });
    const responder = new ClaudeResponder({ client, model: 'claude-opus-5' });

    await expect(responder.respond(input)).resolves.toEqual({
      text: 'Yep, Southside is open until 9 PM!',
      answered: true,
    });

    const params = create.mock.calls[0]![0];
    expect(params.system).toBe(BUTCH_SYSTEM_PROMPT);
    // Leading assistant turns are dropped; the API needs a user message first.
    expect(params.messages.map((m: { role: string }) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
    ]);
    expect(params.messages.at(-1).content).toContain('Live status: Southside Café: open right now');
    // Opted in to Anthropic's server-side refusal fallback for the default model.
    expect(params.fallbacks).toBe('default');
    expect(params.betas).toEqual(['server-side-fallback-2026-07-01']);
  });

  it('treats a safety refusal as "not answered" so Butch falls back', async () => {
    const { client } = fakeClient({ stop_reason: 'refusal', content: [] });
    const responder = new ClaudeResponder({ client, model: 'claude-opus-5' });
    await expect(responder.respond(input)).resolves.toEqual({ text: '', answered: false });
  });

  it('caps reply length and drops replies that get cut off', async () => {
    const { client, create } = fakeClient({
      stop_reason: 'max_tokens',
      content: [{ type: 'text', text: 'Here is a 5,000-word essay about WSU. Chapter 1...' }],
    });
    const responder = new ClaudeResponder({ client, model: 'claude-opus-5' });
    await expect(responder.respond(input)).resolves.toEqual({ text: '', answered: false });
    expect(create.mock.calls[0]![0].max_tokens).toBe(4096);
  });

  it('only sends the refusal fallback and effort settings when they apply', async () => {
    const { client, create } = fakeClient({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'Hi' }],
    });
    await new ClaudeResponder({ client, model: 'claude-haiku-4-5', effort: 'low' }).respond(input);
    const params = create.mock.calls[0]![0];
    expect(params.fallbacks).toBeUndefined();
    expect(params.output_config).toEqual({ effort: 'low' });
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
