import { PrismaPg } from '@prisma/adapter-pg';
import type { Rating } from '@butch/shared';
import { PrismaClient, type Message } from '../generated/prisma/client.ts';
import type { KnowledgeEntry } from '../knowledge/schema.ts';
import type { NewMessage, StoredMessage, Store } from './types.ts';

/**
 * Stores conversations, messages, and feedback in PostgreSQL via Prisma
 * (Milestone 1, section 2.1.8). Used when DATABASE_URL is set.
 * Browse the data with `npm run db:studio`.
 */
export class PrismaStore implements Store {
  readonly name = 'postgres';
  private readonly prisma: PrismaClient;
  private readonly knowledge: KnowledgeEntry[];

  constructor({ databaseUrl, knowledge }: { databaseUrl: string; knowledge: KnowledgeEntry[] }) {
    this.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    this.knowledge = knowledge;
  }

  /** Fails fast with a readable error if the database isn't reachable. */
  async checkConnection(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async listKnowledge(): Promise<KnowledgeEntry[]> {
    return this.knowledge;
  }

  async createConversation(): Promise<string> {
    return (await this.prisma.conversation.create({ data: {} })).id;
  }

  async conversationExists(id: string): Promise<boolean> {
    return (await this.prisma.conversation.count({ where: { id } })) > 0;
  }

  async addMessage(message: NewMessage): Promise<StoredMessage> {
    const row = await this.prisma.message.create({
      data: {
        conversationId: message.conversationId,
        role: message.role,
        text: message.text,
        kind: message.kind,
        entryIds: message.entryIds ?? [],
      },
    });
    return toStoredMessage(row);
  }

  async getMessage(id: string): Promise<StoredMessage | undefined> {
    const row = await this.prisma.message.findUnique({ where: { id } });
    return row ? toStoredMessage(row) : undefined;
  }

  async recentMessages(conversationId: string, limit: number): Promise<StoredMessage[]> {
    const newestFirst = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { seq: 'desc' },
      take: limit,
    });
    return newestFirst.reverse().map(toStoredMessage);
  }

  async setRating(messageId: string, rating: Rating): Promise<void> {
    await this.prisma.feedback.upsert({
      where: { messageId },
      create: { messageId, rating },
      update: { rating },
    });
  }

  async getRating(messageId: string): Promise<Rating | undefined> {
    return (await this.prisma.feedback.findUnique({ where: { messageId } }))?.rating;
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

function toStoredMessage(row: Message): StoredMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    text: row.text,
    kind: row.kind ?? undefined,
    entryIds: row.entryIds,
    createdAt: row.createdAt,
  };
}
