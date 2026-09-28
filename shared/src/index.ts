/**
 * The contract between the Butch AI client and server.
 *
 * Both sides import from here, so changing a shape breaks the build on
 * whichever side falls out of sync (Milestone 1, section 2.1.2).
 */

// ---------------------------------------------------------------------------
// Chat (FR-01 to FR-05)
// ---------------------------------------------------------------------------

/** Longest question a user may send, in characters. */
export const MAX_QUESTION_LENGTH = 500;

export interface SourceLink {
  label: string;
  url: string;
}

export interface ChatRequest {
  message: string;
  /** Omit on the first message; the server starts a new conversation. */
  conversationId?: string;
}

/**
 * `answer`: Butch found the answer in the knowledge base.
 * `fallback`: Butch wasn't confident enough to answer, so he points to a WSU office (FR-05).
 */
export type ReplyKind = 'answer' | 'fallback';

/**
 * How Butch's avatar acts out a reply (US-06). The server picks one per reply
 * from what the reply is about, e.g. `flex` for sports and `shrug` for a fallback.
 * `thinking` is only used by the client while a reply is on its way.
 */
export const BUTCH_POSES = [
  'idle',
  'wave',
  'thinking',
  'hype',
  'point',
  'flex',
  'study',
  'shrug',
  'thumbsup',
] as const;
export type ButchPose = (typeof BUTCH_POSES)[number];

export interface ChatResponse {
  conversationId: string;
  /** ID of Butch's reply; used when rating it. */
  messageId: string;
  reply: string;
  kind: ReplyKind;
  sources: SourceLink[];
  pose: ButchPose;
}

// ---------------------------------------------------------------------------
// Feedback (FR-08)
// ---------------------------------------------------------------------------

export type Rating = 'up' | 'down';

export interface FeedbackRequest {
  messageId: string;
  rating: Rating;
}

export interface FeedbackResponse {
  messageId: string;
  rating: Rating;
}

// ---------------------------------------------------------------------------
// Quick prompts (US-05)
// ---------------------------------------------------------------------------

export interface QuickPrompt {
  id: string;
  /** Shown on the button and sent as the question when clicked. */
  prompt: string;
}

export interface QuickPromptsResponse {
  prompts: QuickPrompt[];
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
}
