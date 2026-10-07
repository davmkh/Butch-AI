import { z } from 'zod';

/** Treats `FOO=` (set but blank) in a .env file the same as not setting FOO. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const EnvSchema = z.object({
  NODE_ENV: optional(z.enum(['development', 'test', 'production'])).default('development'),
  PORT: optional(z.coerce.number().int().positive()).default(3001),
  /** Where the React app is served from; used for CORS in production. */
  CLIENT_ORIGIN: optional(z.string()).default('http://localhost:5173'),
  /** Max chat questions per minute from one IP address. Other API calls may use 5x this. */
  RATE_LIMIT_PER_MINUTE: optional(z.coerce.number().int().positive()).default(20),
  /** PostgreSQL connection string. Unset = keep everything in memory. */
  DATABASE_URL: optional(z.string()),

  /**
   * Which responder writes Butch's replies:
   * - `deepseek`: DeepSeek API (needs DEEPSEEK_API_KEY)
   * - `offline`: deterministic replies built straight from the knowledge base (no API key, used by tests)
   * - `auto`: `deepseek` when an API key is present, otherwise `offline`
   */
  BUTCH_RESPONDER: optional(z.enum(['auto', 'deepseek', 'offline'])).default('auto'),
  DEEPSEEK_API_KEY: optional(z.string()),
  DEEPSEEK_MODEL: optional(z.string()).default('deepseek-flash'),

  /** Minimum retrieval score (0 to 1) before Butch answers instead of falling back (FR-05). */
  BUTCH_CONFIDENCE_THRESHOLD: optional(z.coerce.number().min(0).max(1)).default(0.6),

  /** Pretend "now" is this ISO timestamp. Dev/test only, for demoing open/closed and deadlines. */
  BUTCH_FAKE_NOW: optional(z.iso.datetime({ offset: true })),
  /** Test only: honor the X-Butch-Fake-Now request header. The e2e suite turns this on. */
  BUTCH_TEST_HOOKS: optional(z.enum(['true', 'false'])).default('false'),
});

export interface Config {
  env: 'development' | 'test' | 'production';
  port: number;
  clientOrigin: string;
  rateLimitPerMinute: number;
  databaseUrl?: string;
  responder: 'deepseek' | 'offline';
  deepseek: {
    apiKey?: string;
    model: string;
  };
  confidenceThreshold: number;
  fakeNow?: Date;
  testHooks: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables:\n${z.prettifyError(parsed.error)}`);
  }
  const e = parsed.data;

  if (e.BUTCH_RESPONDER === 'deepseek' && !e.DEEPSEEK_API_KEY) {
    throw new Error('BUTCH_RESPONDER=deepseek requires DEEPSEEK_API_KEY to be set.');
  }
  if (e.BUTCH_FAKE_NOW && e.NODE_ENV === 'production') {
    throw new Error('BUTCH_FAKE_NOW must not be set in production.');
  }
  if (e.BUTCH_TEST_HOOKS === 'true' && e.NODE_ENV === 'production') {
    throw new Error('BUTCH_TEST_HOOKS must not be enabled in production.');
  }

  const autoResponder = e.DEEPSEEK_API_KEY ? 'deepseek' : 'offline';

  return {
    env: e.NODE_ENV,
    port: e.PORT,
    clientOrigin: e.CLIENT_ORIGIN,
    rateLimitPerMinute: e.RATE_LIMIT_PER_MINUTE,
    databaseUrl: e.DATABASE_URL,
    responder: e.BUTCH_RESPONDER === 'auto' ? autoResponder : e.BUTCH_RESPONDER,
    deepseek: {
      apiKey: e.DEEPSEEK_API_KEY,
      model: e.DEEPSEEK_MODEL,
    },
    confidenceThreshold: e.BUTCH_CONFIDENCE_THRESHOLD,
    fakeNow: e.BUTCH_FAKE_NOW ? new Date(e.BUTCH_FAKE_NOW) : undefined,
    testHooks: e.BUTCH_TEST_HOOKS === 'true',
  };
}
