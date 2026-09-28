import { defineConfig } from 'vitest/config';

// `npm run test:db`: tests against the real PostgreSQL database (start it with `npm run db:up`).
try {
  process.loadEnvFile('.env');
} catch {
  // No .env: DATABASE_URL may come from the environment (e.g. CI).
}

export default defineConfig({
  test: {
    include: ['src/**/*.db.test.ts'],
    fileParallelism: false,
  },
});
