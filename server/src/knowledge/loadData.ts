import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { QuickPrompt } from '@butch/shared';
import {
  KnowledgeFileSchema,
  OfficesFileSchema,
  QuickPromptsFileSchema,
  type KnowledgeEntry,
  type OfficesFile,
} from './schema.ts';

/** server/data/, where the seed JSON files live. */
export const DATA_DIR = path.resolve(import.meta.dirname, '../../data');

async function readJson<S extends z.ZodType>(fileName: string, schema: S): Promise<z.infer<S>> {
  const filePath = path.join(DATA_DIR, fileName);
  const parsed = schema.safeParse(JSON.parse(await readFile(filePath, 'utf8')));
  if (!parsed.success) {
    throw new Error(`Invalid data in server/data/${fileName}:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

/** Loads and validates the knowledge base seed (FR-03). Fails loudly on typos or duplicate IDs. */
export async function loadKnowledgeBase(): Promise<KnowledgeEntry[]> {
  const { entries } = await readJson('knowledge-base.json', KnowledgeFileSchema);
  const seen = new Set<string>();
  for (const { id } of entries) {
    if (seen.has(id))
      throw new Error(`Duplicate knowledge entry id "${id}" in knowledge-base.json`);
    seen.add(id);
  }
  return entries;
}

export async function loadOffices(): Promise<OfficesFile> {
  return readJson('offices.json', OfficesFileSchema);
}

export async function loadQuickPrompts(): Promise<QuickPrompt[]> {
  return (await readJson('quick-prompts.json', QuickPromptsFileSchema)).prompts;
}
