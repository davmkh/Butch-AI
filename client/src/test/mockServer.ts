import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type {
  ChatRequest,
  ChatResponse,
  FeedbackRequest,
  QuickPromptsResponse,
} from '@butch/shared';

/**
 * A fake Butch API for component tests (Mock Service Worker). Tests never hit
 * the real server or the Claude API, so they're fast, free, and repeatable.
 */

/** Requests the fake API received, for assertions. Cleared after each test. */
export const received = {
  chat: [] as ChatRequest[],
  feedback: [] as FeedbackRequest[],
};

export const SITE_PROMPTS: QuickPromptsResponse = {
  prompts: [
    { id: 'campus-life', prompt: 'Tell me about campus life' },
    { id: 'southside', prompt: 'Is Southside open right now?' },
  ],
};

export function chatReply(request: ChatRequest): ChatResponse {
  return {
    conversationId: request.conversationId ?? 'conversation-1',
    messageId: crypto.randomUUID(),
    reply: `Here's what I know about: ${request.message}`,
    kind: 'answer',
    pose: 'thumbsup',
    sources: [{ label: 'WSU Academic Calendar', url: 'https://catalog.wsu.edu/AcademicCalendar' }],
  };
}

export const handlers = [
  http.get('*/api/quick-prompts', () => HttpResponse.json(SITE_PROMPTS)),
  http.post('*/api/chat', async ({ request }) => {
    const body = (await request.json()) as ChatRequest;
    received.chat.push(body);
    return HttpResponse.json(chatReply(body));
  }),
  http.post('*/api/feedback', async ({ request }) => {
    const body = (await request.json()) as FeedbackRequest;
    received.feedback.push(body);
    return HttpResponse.json(body);
  }),
];

export const mockServer = setupServer(...handlers);
