import type { KnowledgeEntry } from '../knowledge/schema.ts';

/** A knowledge entry retrieved for this question, plus its time-sensitive status. */
export interface GroundedFact {
  entry: KnowledgeEntry;
  /** Retrieval score from 0 to 1. */
  score: number;
  /** e.g. "Southside Café is open right now and closes at 9:00 PM today." */
  liveStatus?: string;
}

export interface HistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface ResponderInput {
  question: string;
  /** Earlier turns in this conversation, oldest first. */
  history: HistoryTurn[];
  /** Best matches first. Always at least one: with none, Butch falls back before calling a responder. */
  facts: GroundedFact[];
  now: Date;
}

export interface ResponderResult {
  text: string;
  /** False when the responder declined to answer (e.g. an AI safety refusal). */
  answered: boolean;
}

/** Turns retrieved facts into Butch's reply. */
export interface Responder {
  readonly name: 'claude' | 'offline';
  respond(input: ResponderInput): Promise<ResponderResult>;
}
