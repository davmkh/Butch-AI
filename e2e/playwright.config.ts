import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium, defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * Gherkin acceptance tests (Milestone 1, section 2.2.2). Each user story's
 * Given/When/Then scenarios in features/ run as Playwright tests.
 *
 * The suite starts its own API (offline responder, the "stubbed model route",
 * so no API key or cost) and web app on separate ports, so it never collides
 * with a dev server you have running.
 */
const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: 'steps/*.ts',
  // Stories that aren't built yet stay in features/ as backlog, tagged @todo.
  tags: 'not @todo',
});

const CI = Boolean(process.env.CI);
const repoRoot = path.resolve(import.meta.dirname, '..');
// Out of the way of dev servers (Vite hops to 5174, 5175... when 5173 is busy).
const API_PORT = 3199;
const WEB_PORT = 5199;

// Uses Playwright's own Chromium when it's installed (`npm run install-browsers -w e2e`,
// about 150 MB). Otherwise falls back to the Google Chrome already on this computer
// (with a throwaway profile). Override with E2E_BROWSER_CHANNEL=chrome or msedge.
const channel =
  process.env.E2E_BROWSER_CHANNEL ?? (existsSync(chromium.executablePath()) ? undefined : 'chrome');

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel } }],
  webServer: [
    {
      // `start`, not `dev`: no file watching, so the server can't restart mid-run when
      // something else (e.g. `npm test`) regenerates the Prisma client.
      command: 'npm run start -w server',
      cwd: repoRoot,
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      // These win over anything in server/.env: no AI, in-memory storage so tests never
      // write to your dev database or need Docker running, and the fake-clock test hook.
      env: {
        PORT: String(API_PORT),
        BUTCH_RESPONDER: 'offline',
        DATABASE_URL: '',
        BUTCH_TEST_HOOKS: 'true',
        RATE_LIMIT_PER_MINUTE: '10000',
      },
    },
    {
      command: `npm run dev -w client -- --port ${WEB_PORT} --strictPort`,
      cwd: repoRoot,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      env: { BUTCH_API_PROXY: `http://localhost:${API_PORT}` },
    },
  ],
});
