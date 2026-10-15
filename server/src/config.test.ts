import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.ts';

describe('loadConfig', () => {
  it('uses safe defaults with an empty environment', () => {
    expect(loadConfig({})).toMatchObject({
      env: 'development',
      port: 3001,
      responder: 'offline',
      databaseUrl: undefined,
      rateLimitPerMinute: 20,
      testHooks: false,
    });
  });

  it('treats blank values in .env as unset', () => {
    expect(loadConfig({ DEEPSEEK_API_KEY: '', DATABASE_URL: '' })).toMatchObject({
      responder: 'offline',
      databaseUrl: undefined,
    });
  });

  it('turns DeepSeek on automatically when an API key is present', () => {
    expect(loadConfig({ DEEPSEEK_API_KEY: 'test-key' }).responder).toBe('deepseek');
    expect(loadConfig({ DEEPSEEK_API_KEY: 'test-key', BUTCH_RESPONDER: 'offline' }).responder).toBe(
      'offline',
    );
  });

  it('refuses unsafe or impossible combinations', () => {
    expect(() => loadConfig({ BUTCH_RESPONDER: 'deepseek' })).toThrow(/DEEPSEEK_API_KEY/);
    expect(() => loadConfig({ NODE_ENV: 'production', BUTCH_TEST_HOOKS: 'true' })).toThrow(
      /production/,
    );
    expect(() =>
      loadConfig({ NODE_ENV: 'production', BUTCH_FAKE_NOW: '2026-09-22T00:00:00-07:00' }),
    ).toThrow(/production/);
    expect(() => loadConfig({ PORT: 'not-a-number' })).toThrow(/Invalid server environment/);
  });
});
