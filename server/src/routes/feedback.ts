import { Router } from 'express';
import { z } from 'zod';
import type { FeedbackRequest, FeedbackResponse } from '@butch/shared';
import type { Store } from '../store/types.ts';
import { sendValidationError } from './validation.ts';

const FeedbackRequestSchema = z.object({
  messageId: z.uuid(),
  rating: z.enum(['up', 'down']),
}) satisfies z.ZodType<FeedbackRequest>;

export function feedbackRouter({ store }: { store: Store }): Router {
  const router = Router();

  // POST /api/feedback: thumbs up/down on one of Butch's replies (FR-08, US-07)
  router.post('/', async (req, res) => {
    const parsed = FeedbackRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(res, parsed.error);
    const { messageId, rating } = parsed.data;

    const message = await store.getMessage(messageId);
    if (!message || message.role !== 'butch') {
      return res.status(404).json({ error: 'No reply from Butch with that ID.' });
    }

    // Setting a new rating replaces the old one, so each reply keeps one rating.
    await store.setRating(messageId, rating);
    const body: FeedbackResponse = { messageId, rating };
    res.json(body);
  });

  return router;
}
