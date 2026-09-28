import type { Response } from 'express';
import type { z } from 'zod';
import type { ApiError } from '@butch/shared';

/** Responds 400 with the first validation problem in plain English. */
export function sendValidationError(res: Response, error: z.ZodError): void {
  const body: ApiError = { error: error.issues[0]?.message ?? 'Invalid request.' };
  res.status(400).json(body);
}
