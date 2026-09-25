import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import type { Store } from './types.ts';

/**
 * Behavior every Store must have. Run against both the in-memory store and
 * PostgreSQL so swapping them can't change how the app behaves.
 */
export function describeStoreContract(
  name: string,
  getStore: () => Store,
  cleanup?: (conversationIds: string[]) => Promise<void>,
) {
  describe(`${name} store`, () => {
    let created: string[] = [];
    const newConversation = async () => {
      const id = await getStore().createConversation();
      created.push(id);
      return id;
    };

    afterEach(async () => {
      await cleanup?.(created);
      created = [];
    });

    it('creates conversations and recognizes unknown IDs', async () => {
      const id = await newConversation();
      expect(await getStore().conversationExists(id)).toBe(true);
      expect(await getStore().conversationExists(randomUUID())).toBe(false);
    });

    it('stores a message and reads it back', async () => {
      const conversationId = await newConversation();
      const saved = await getStore().addMessage({
        conversationId,
        role: 'butch',
        text: 'Go Cougs!',
        kind: 'answer',
        entryIds: ['campus-life'],
      });
      expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(await getStore().getMessage(saved.id)).toMatchObject({
        conversationId,
        role: 'butch',
        text: 'Go Cougs!',
        kind: 'answer',
        entryIds: ['campus-life'],
      });
      expect(await getStore().getMessage(randomUUID())).toBeUndefined();
    });

    it('returns the newest messages of one conversation, oldest first', async () => {
      const a = await newConversation();
      const b = await newConversation();
      for (const text of ['1', '2', '3', '4', '5']) {
        await getStore().addMessage({ conversationId: a, role: 'user', text });
      }
      await getStore().addMessage({ conversationId: b, role: 'user', text: 'other' });

      const recent = await getStore().recentMessages(a, 3);
      expect(recent.map((m) => m.text)).toEqual(['3', '4', '5']);
    });

    it('keeps one rating per reply, replacing it when changed', async () => {
      const conversationId = await newConversation();
      const reply = await getStore().addMessage({ conversationId, role: 'butch', text: 'Hi' });

      expect(await getStore().getRating(reply.id)).toBeUndefined();
      await getStore().setRating(reply.id, 'up');
      await getStore().setRating(reply.id, 'down');
      expect(await getStore().getRating(reply.id)).toBe('down');
    });
  });
}
