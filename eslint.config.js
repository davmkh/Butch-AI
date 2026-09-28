// ESLint flat config for the whole repo (Milestone 1, section 2.2.4).
// Kept deliberately modest so warnings stay meaningful.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/node_modules',
    '**/dist',
    '**/coverage',
    'e2e/.features-gen',
    'e2e/test-results',
    'e2e/playwright-report',
    'server/src/generated',
  ]),

  js.configs.recommended,
  tseslint.configs.recommended,

  // Server, shared code, e2e tests, and config files run in Node.
  {
    files: ['server/**/*.ts', 'shared/**/*.ts', 'e2e/**/*.ts', '*.js', 'client/vite.config.ts'],
    languageOptions: { globals: globals.node },
  },

  // React app: hooks rules, fast-refresh safety, and accessibility checks (NFR-05).
  {
    files: ['client/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    rules: {
      // The chat history (role="log") scrolls, so it must be focusable for keyboard scrolling
      // (WCAG 2.1.1; axe "scrollable-region-focusable").
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['log'] }],
    },
  },

  // Playwright fixtures/steps that need no fixtures are written `async ({}, ...)` by convention.
  {
    files: ['e2e/**/*.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },

  {
    rules: {
      // Allow intentionally unused args/vars when prefixed with _ (e.g. Express error handlers).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Turns off style rules that Prettier handles. Keep last.
  prettier,
]);
