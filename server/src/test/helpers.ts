import { createApp } from '../app.ts';
import { loadKnowledgeBase, loadOffices, loadQuickPrompts } from '../knowledge/loadData.ts';
import { OfflineResponder } from '../responders/offlineResponder.ts';
import type { Responder } from '../responders/types.ts';
import { Butch } from '../services/butch.ts';
import { MemoryStore } from '../store/memoryStore.ts';

/** Builds the real app with the real seed data, offline responder, and a pinned clock. */
export async function buildTestApp({
  now = new Date('2026-09-25T14:00:00-07:00'),
  responder = new OfflineResponder(),
  env = 'test',
  rateLimitPerMinute = 1000,
  testHooks = false,
}: {
  now?: Date;
  responder?: Responder;
  env?: 'test' | 'production';
  rateLimitPerMinute?: number;
  testHooks?: boolean;
} = {}) {
  const [knowledge, offices, quickPrompts] = await Promise.all([
    loadKnowledgeBase(),
    loadOffices(),
    loadQuickPrompts(),
  ]);
  const store = new MemoryStore({ knowledge });
  const butch = new Butch({
    store,
    offices,
    responder,
    backupResponder: new OfflineResponder(),
    confidenceThreshold: 0.6,
    logger: { warn: () => {} },
  });
  const app = createApp({
    config: { env, clientOrigin: 'http://localhost:5173', rateLimitPerMinute, testHooks },
    store,
    butch,
    quickPrompts,
    clock: () => now,
  });
  return { app, store };
}

/** Pullman local time, e.g. pullman('2026-09-21 12:00'). Fall dates are PDT (UTC-7), winter dates PST (UTC-8). */
export function pullman(localDateTime: string, utcOffset: '-07:00' | '-08:00' = '-07:00'): Date {
  return new Date(`${localDateTime.replace(' ', 'T')}:00${utcOffset}`);
}
