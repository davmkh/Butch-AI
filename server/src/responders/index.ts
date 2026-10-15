import type { Config } from '../config.ts';
import { DeepSeekResponder } from './deepseekResponder.ts';
import { OfflineResponder } from './offlineResponder.ts';
import type { Responder } from './types.ts';

export function createResponder(config: Config): Responder {
  if (config.responder === 'offline') return new OfflineResponder();

  return new DeepSeekResponder({
    apiKey: config.deepseek.apiKey!,
    model: config.deepseek.model,
  });
}
