import type { Rating, ReplyKind } from '@butch/shared';
import type { KnowledgeEntry } from '../knowledge/schema.ts';

/**
 * Everything the server persists. Routes only talk to this interface, so the
 * storage can be in memory (no setup, for quick runs and tests) or PostgreSQL
 * (`prismaStore.ts`, when DATABASE_URL is set) without touching them. The
 * shape mirrors `server/prisma/schema.prisma`.
 *
 * Privacy (FR-09): nothing here identifies a user. No names, emails, IP
 * addresses, or user agents are stored, only the anonymous conversation ID.
 */
export interface Store {
  readonly name: 'memory' | 'postgres';

  /**
   * The current knowledge base. Read on every question, so admin edits apply without a
   * redeploy (NFR-07). For now it always comes from server/data/knowledge-base.json; it moves
   * into the database with the admin editor (US-09).
   */
  listKnowledge(): Promise<KnowledgeEntry[]>;

  createConversation(): Promise<string>;
  conversationExists(id: string): Promise<boolean>;

  /** Logs one chat message (FR-09). */
  addMessage(message: NewMessage): Promise<StoredMessage>;
  getMessage(id: string): Promise<StoredMessage | undefined>;
  /** The newest `limit` messages of a conversation, oldest first. */
  recentMessages(conversationId: string, limit: number): Promise<StoredMessage[]>;

  /** Creates or replaces the rating on one of Butch's replies: one rating per reply (FR-08). */
  setRating(messageId: string, rating: Rating): Promise<void>;
  getRating(messageId: string): Promise<Rating | undefined>;

  /** Releases connections on shutdown. */
  close(): Promise<void>;
}

export type MessageRole = 'user' | 'butch';

export interface NewMessage {
  conversationId: string;
  role: MessageRole;
  text: string;
  /** Only for Butch's replies. */
  kind?: ReplyKind;
  /** Knowledge entries used to answer, for spotting gaps in the knowledge base (US-08). */
  entryIds?: string[];
}

export interface StoredMessage extends NewMessage {
  id: string;
  createdAt: Date;
}
