import { createApp } from './app.ts';
import { loadConfig } from './config.ts';
import { loadKnowledgeBase, loadOffices, loadQuickPrompts } from './knowledge/loadData.ts';
import type { KnowledgeEntry } from './knowledge/schema.ts';
import { createResponder } from './responders/index.ts';
import { OfflineResponder } from './responders/offlineResponder.ts';
import { Butch } from './services/butch.ts';
import { MemoryStore } from './store/memoryStore.ts';
import { PrismaStore } from './store/prismaStore.ts';
import type { Store } from './store/types.ts';

const config = loadConfig();

const [knowledge, offices, quickPrompts] = await Promise.all([
  loadKnowledgeBase(),
  loadOffices(),
  loadQuickPrompts(),
]);

const store = await createStore(config.databaseUrl, knowledge);

const butch = new Butch({
  store,
  offices,
  responder: createResponder(config),
  backupResponder: new OfflineResponder(),
  confidenceThreshold: config.confidenceThreshold,
});

const clock = config.fakeNow ? () => config.fakeNow! : () => new Date();

const app = createApp({ config, store, butch, quickPrompts, clock });

const server = app.listen(config.port, () => {
  console.log(`[server] Butch AI API on http://localhost:${config.port}`);
  console.log(
    `[server] responder: ${butch.responderName}` +
      (butch.responderName === 'deepseek' ? ` (${config.deepseek.model})` : ' (no AI)') +
      ` | storage: ${store.name} | knowledge entries: ${knowledge.length}`,
  );
  if (config.fakeNow)
    console.log(`[server] BUTCH_FAKE_NOW: pretending it is ${config.fakeNow.toISOString()}`);
});

// Close database connections cleanly on Ctrl+C or when the host stops the server.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close();
    void store.close().finally(() => process.exit(0));
  });
}

/** PostgreSQL when DATABASE_URL is set (checked up front), otherwise in-memory. */
async function createStore(
  databaseUrl: string | undefined,
  entries: KnowledgeEntry[],
): Promise<Store> {
  if (!databaseUrl) return new MemoryStore({ knowledge: entries });

  const prismaStore = new PrismaStore({ databaseUrl, knowledge: entries });
  try {
    await prismaStore.checkConnection();
  } catch (error) {
    console.error(
      `[server] Can't reach the database at ${new URL(databaseUrl).host}.\n` +
        '  Is Docker running? Start the database with: npm run db:up\n' +
        '  Or remove DATABASE_URL from server/.env to keep data in memory instead.\n',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
  return prismaStore;
}
