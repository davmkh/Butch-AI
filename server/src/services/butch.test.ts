import { describe, expect, it, vi } from 'vitest';
import { loadKnowledgeBase, loadOffices } from '../knowledge/loadData.ts';
import { OfflineResponder } from '../responders/offlineResponder.ts';
import type { Responder } from '../responders/types.ts';
import { MemoryStore } from '../store/memoryStore.ts';
import { pullman } from '../test/helpers.ts';
import { Butch } from './butch.ts';

async function buildButch(responder: Responder) {
  const warn = vi.fn();
  const butch = new Butch({
    store: new MemoryStore({ knowledge: await loadKnowledgeBase() }),
    offices: await loadOffices(),
    responder,
    backupResponder: new OfflineResponder(),
    confidenceThreshold: 0.6,
    logger: { warn },
  });
  return { butch, warn };
}

const now = pullman('2026-09-25 14:00');

describe('Butch', () => {
  it('does not call the responder at all when it is not confident (FR-05)', async () => {
    const respond = vi.fn();
    const { butch } = await buildButch({ name: 'claude', respond });
    const reply = await butch.reply('How do I get a refund on my parking permit?', [], now);
    expect(reply.kind).toBe('fallback');
    expect(respond).not.toHaveBeenCalled();
  });

  it('uses the offline backup if the main responder throws (NFR-03)', async () => {
    const failing: Responder = {
      name: 'claude',
      respond: () => Promise.reject(new Error('API down')),
    };
    const { butch, warn } = await buildButch(failing);
    const reply = await butch.reply('Tell me about campus life', [], now);
    expect(reply.kind).toBe('answer');
    expect(reply.text).toContain('500+ student organizations');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('falls back when the responder declines to answer', async () => {
    const { butch } = await buildButch({
      name: 'claude',
      respond: async () => ({ text: '', answered: false }),
    });
    const reply = await butch.reply('Tell me about campus life', [], now);
    expect(reply.kind).toBe('fallback');
  });
});
