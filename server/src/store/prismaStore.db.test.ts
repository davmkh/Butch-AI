import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe } from 'vitest';
import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaStore } from './prismaStore.ts';
import { describeStoreContract } from './storeContract.ts';

/**
 * Runs the store contract against a real PostgreSQL database.
 * Needs the database running (`npm run db:up`); run with `npm run test:db`.
 * Deletes everything it creates, so it's safe to point at your dev database.
 */
const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('PostgreSQL', () => {
  let store: PrismaStore;
  let admin: PrismaClient;

  beforeAll(async () => {
    store = new PrismaStore({ databaseUrl: databaseUrl!, knowledge: [] });
    await store.checkConnection();
    admin = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
  });

  afterAll(async () => {
    await store?.close();
    await admin?.$disconnect();
  });

  describeStoreContract(
    'postgres',
    () => store,
    // Deleting a conversation also deletes its messages and feedback (ON DELETE CASCADE).
    async (ids) => {
      await admin.conversation.deleteMany({ where: { id: { in: ids } } });
    },
  );
});
