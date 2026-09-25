import cors from 'cors';
import express, { type ErrorRequestHandler, type Express, type Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { ApiError, QuickPrompt, QuickPromptsResponse } from '@butch/shared';
import type { Config } from './config.ts';
import { chatRouter } from './routes/chat.ts';
import { feedbackRouter } from './routes/feedback.ts';
import type { Butch } from './services/butch.ts';
import type { Store } from './store/types.ts';

export interface AppDependencies {
  config: Pick<Config, 'env' | 'clientOrigin' | 'rateLimitPerMinute' | 'testHooks'>;
  store: Store;
  butch: Butch;
  quickPrompts: QuickPrompt[];
  /** Injected so tests can pin "now" (e.g. to check dining hours at midnight). */
  clock: () => Date;
}

/** Builds the Express app without starting it, so Supertest can call it directly. */
export function createApp({ config, store, butch, quickPrompts, clock }: AppDependencies): Express {
  const app = express();

  // Test hook (BUTCH_TEST_HOOKS=true, never in production): an `X-Butch-Fake-Now`
  // header pins "now" for a single request, so end-to-end tests can ask
  // "Is Southside open?" at noon and at midnight. Otherwise the real clock is used.
  const now = (req: Request): Date => {
    const header = config.testHooks ? req.get('x-butch-fake-now') : undefined;
    const fake = header ? new Date(header) : undefined;
    return fake && !Number.isNaN(fake.getTime()) ? fake : clock();
  };

  // Render (and most hosts) sit behind one proxy; needed for correct client IPs in rate limiting.
  if (config.env === 'production') app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin }));
  // Every API route gets a loose per-IP limit; /api/chat adds a stricter one of its own.
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: config.rateLimitPerMinute * 5,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Too many requests. Please try again in a minute.' } satisfies ApiError,
    }),
  );
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', responder: butch.responderName, storage: store.name });
  });

  // GET /api/quick-prompts: FAQ buttons (US-05)
  app.get('/api/quick-prompts', (_req, res) => {
    const body: QuickPromptsResponse = { prompts: quickPrompts };
    res.json(body);
  });

  app.use(
    '/api/chat',
    chatRouter({ store, butch, now, rateLimitPerMinute: config.rateLimitPerMinute }),
  );
  app.use('/api/feedback', feedbackRouter({ store }));

  app.use('/api', (_req, res) => {
    const body: ApiError = { error: 'Not found.' };
    res.status(404).json(body);
  });

  app.use(errorHandler);
  return app;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Malformed or oversized JSON bodies from express.json()
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' } satisfies ApiError);
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' } satisfies ApiError);
  }
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on our end.' } satisfies ApiError);
};
