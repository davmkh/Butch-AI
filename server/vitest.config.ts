import { configDefaults, defineConfig } from 'vitest/config';

// `npm test`: fast unit/integration tests that need no database.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.db.test.ts'],
  },
});
