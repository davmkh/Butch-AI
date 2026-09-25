import { defineConfig } from 'prisma/config';

// Prisma 7 doesn't read .env on its own. Load server/.env if it exists.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: fine, DATABASE_URL may come from the real environment (CI, hosting).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // Read directly (not env()) so commands like `prisma generate` work without a database.
    url: process.env.DATABASE_URL ?? '',
  },
});
