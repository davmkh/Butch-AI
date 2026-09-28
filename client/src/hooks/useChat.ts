import { useCallback, useRef, useState } from 'react';
import type { ButchPose, Rating, ReplyKind, SourceLink } from '@butch/shared';
import { ApiRequestError, type ButchApi } from '../api/butchApi.ts';

export type ChatStatus = 'idle' | 'thinking';

export interface ChatMessage {
  /** Local ID for React keys. */
  id: string;
  role: 'user' | 'butch';
  text: string;
  /** For Butch's messages: a normal answer, a fallback, the greeting, or an error notice. */
  kind?: ReplyKind | 'greeting' | 'error';
  sources?: SourceLink[];
  /** How Butch's avatar acts out this message. */
  pose?: ButchPose;
  /** The server's ID for this reply. Only replies with one can be rated. */
  serverId?: string;
  rating?: Rating;
}

export const GREETING =
  "HEY HEY, Coug! I'm Butch, and I am SO pumped you're here! Ask me about dining, deadlines, admissions, Cougar sports, undergrad research, tutoring, the Rec, campus life, and more. Go Cougs! 🐾";

const greetingMessage = (): ChatMessage => ({
  id: crypto.randomUUID(),
  role: 'butch',
  kind: 'greeting',
  pose: 'wave',
  text: GREETING,
});

/**
 * Conversation state for the chat window.
 * - send(): submit a question (FR-01) and add Butch's reply (FR-02)
 * - reset(): start a new conversation (FR-06); the server keeps its log
 * - rate(): thumbs up/down, one rating per reply (FR-08)
 * History lives in memory for the whole page session (FR-07).
 */
export function useChat(api: ButchApi) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [greetingMessage()]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const conversationId = useRef<string | undefined>(undefined);
  // Bumped on reset so a reply that arrives for an old conversation is ignored.
  const generation = useRef(0);
  const inFlight = useRef(false);

  const send = useCallback(
    async (rawText: string): Promise<boolean> => {
      const text = rawText.trim();
      if (!text || inFlight.current) return false;

      inFlight.current = true;
      const myGeneration = generation.current;
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }]);
      setStatus('thinking');

      let reply: ChatMessage;
      try {
        const res = await api.chat({ message: text, conversationId: conversationId.current });
        if (myGeneration !== generation.current) return true;
        conversationId.current = res.conversationId;
        reply = {
          id: crypto.randomUUID(),
          role: 'butch',
          kind: res.kind,
          text: res.reply,
          sources: res.sources,
          pose: res.pose,
          serverId: res.messageId,
        };
      } catch (error) {
        if (myGeneration !== generation.current) return true;
        const serverSaid =
          error instanceof ApiRequestError && error.status >= 400 && error.status < 500;
        reply = {
          id: crypto.randomUUID(),
          role: 'butch',
          kind: 'error',
          pose: 'shrug',
          text: serverSaid
            ? error.message
            : "Sorry, I couldn't reach the Butch server just now. Please try again in a moment.",
        };
      } finally {
        if (myGeneration === generation.current) {
          inFlight.current = false;
          setStatus('idle');
        }
      }

      setMessages((prev) => [...prev, reply]);
      return true;
    },
    [api],
  );

  const reset = useCallback(() => {
    generation.current += 1;
    inFlight.current = false;
    conversationId.current = undefined;
    setStatus('idle');
    setMessages([greetingMessage()]);
  }, []);

  const rate = useCallback(
    async (messageId: string, rating: Rating) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target?.serverId || target.rating === rating) return;

      const previous = target.rating;
      const setRating = (value: Rating | undefined) =>
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, rating: value } : m)));

      setRating(rating); // show it right away
      try {
        await api.sendFeedback({ messageId: target.serverId, rating });
      } catch {
        setRating(previous); // undo if the server didn't save it
      }
    },
    [api, messages],
  );

  return { messages, status, send, reset, rate };
}
