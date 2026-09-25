import Anthropic from '@anthropic-ai/sdk';
import type { Config } from '../config.ts';
import { ClaudeResponder } from './claudeResponder.ts';
import { OfflineResponder } from './offlineResponder.ts';
import type { Responder } from './types.ts';

export function createResponder(config: Config): Responder {
  if (config.responder === 'offline') return new OfflineResponder();

  const client = new Anthropic({
    apiKey: config.anthropic.apiKey,
    // Fail fast so a slow API call falls back to an offline answer instead of hanging the chat.
    timeout: 30_000,
    maxRetries: 1,
  });
  return new ClaudeResponder({
    client,
    model: config.anthropic.model,
    effort: config.anthropic.effort,
  });
}
