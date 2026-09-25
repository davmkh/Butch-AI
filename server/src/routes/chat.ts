import { Router, type Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { MAX_QUESTION_LENGTH, type ChatRequest, type ChatResponse } from '@butch/shared';
import type { HistoryTurn } from '../responders/types.ts';
import type { Butch } from '../services/butch.ts';
import type { Store } from '../store/types.ts';
import { sendValidationError } from './validation.ts';

/** How many earlier messages Butch sees for follow-up questions. */
const HISTORY_MESSAGES = 6;

const ChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(MAX_QUESTION_LENGTH, `Message must be ${MAX_QUESTION_LENGTH} characters or fewer.`),
  conversationId: z.uuid().optional(),
}) satisfies z.ZodType<ChatRequest>;

export function chatRouter({
  store,
  butch,
  now,
  rateLimitPerMinute,
}: {
  store: Store;
  butch: Butch;
  now: (req: Request) => Date;
  rateLimitPerMinute: number;
}): Router {
  const router = Router();

  // Curbs abuse and caps AI cost (Milestone 1, section 2.1.6).
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: rateLimitPerMinute,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Whoa there, Coug! Too many questions at once. Try again in a minute.' },
  });

  // POST /api/chat: ask Butch a question (FR-01, FR-03, FR-05, FR-09)
  router.post('/', limiter, async (req, res) => {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(res, parsed.error);
    const { message } = parsed.data;

    // Unknown IDs (e.g. after a server restart) quietly start a fresh conversation.
    const conversationId =
      parsed.data.conversationId && (await store.conversationExists(parsed.data.conversationId))
        ? parsed.data.conversationId
        : await store.createConversation();

    const history: HistoryTurn[] = (
      await store.recentMessages(conversationId, HISTORY_MESSAGES)
    ).map((m) => ({ role: m.role === 'butch' ? 'assistant' : 'user', text: m.text }));

    await store.addMessage({ conversationId, role: 'user', text: message });
    const reply = await butch.reply(message, history, now(req));
    const saved = await store.addMessage({
      conversationId,
      role: 'butch',
      text: reply.text,
      kind: reply.kind,
      entryIds: reply.entryIds,
    });

    const body: ChatResponse = {
      conversationId,
      messageId: saved.id,
      reply: reply.text,
      kind: reply.kind,
      sources: reply.sources,
    };
    res.json(body);
  });

  return router;
}
