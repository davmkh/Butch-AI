import { randomUUID } from 'node:crypto';
import type { Rating } from '@butch/shared';
import type { KnowledgeEntry } from '../knowledge/schema.ts';
import type { NewMessage, StoredMessage, Store } from './types.ts';

/**
 * Keeps everything in memory: no setup, used by tests and when DATABASE_URL
 * isn't set. Everything is lost when the server restarts.
 */
export class MemoryStore implements Store {
  readonly name = 'memory';
  private readonly knowledge: KnowledgeEntry[];
  private readonly conversations = new Set<string>();
  private readonly messages = new Map<string, StoredMessage>();
  private readonly ratings = new Map<string, Rating>();

  constructor({ knowledge = [] }: { knowledge?: KnowledgeEntry[] } = {}) {
    this.knowledge = structuredClone(knowledge);
  }

  async listKnowledge(): Promise<KnowledgeEntry[]> {
    return this.knowledge;
  }

  async createConversation(): Promise<string> {
    const id = randomUUID();
    this.conversations.add(id);
    return id;
  }

  async conversationExists(id: string): Promise<boolean> {
    return this.conversations.has(id);
  }

  async addMessage(message: NewMessage): Promise<StoredMessage> {
    const stored: StoredMessage = { ...message, id: randomUUID(), createdAt: new Date() };
    this.messages.set(stored.id, stored);
    return stored;
  }

  async getMessage(id: string): Promise<StoredMessage | undefined> {
    return this.messages.get(id);
  }

  async recentMessages(conversationId: string, limit: number): Promise<StoredMessage[]> {
    // Map iteration follows insertion order, so this is already oldest-first.
    const inConversation = [...this.messages.values()].filter(
      (m) => m.conversationId === conversationId,
    );
    return inConversation.slice(-limit);
  }

  async setRating(messageId: string, rating: Rating): Promise<void> {
    this.ratings.set(messageId, rating);
  }

  async getRating(messageId: string): Promise<Rating | undefined> {
    return this.ratings.get(messageId);
  }

  async close(): Promise<void> {}
}
