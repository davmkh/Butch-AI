import type {
  ApiError,
  ChatRequest,
  ChatResponse,
  FeedbackRequest,
  FeedbackResponse,
  QuickPrompt,
  QuickPromptsResponse,
} from '@butch/shared';

/** Everything the UI needs from the server. Components get this through props/hooks so tests can swap it. */
export interface ButchApi {
  chat(request: ChatRequest): Promise<ChatResponse>;
  sendFeedback(request: FeedbackRequest): Promise<FeedbackResponse>;
  quickPrompts(): Promise<QuickPrompt[]>;
}

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

/**
 * In development Vite proxies /api to the server, so the page's own origin works.
 * In production set VITE_API_URL to the API's address (e.g. the Render web service).
 */
const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(new URL(`/api${path}`, API_BASE), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiRequestError("Couldn't reach the Butch server.", 0);
  }

  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = (body as ApiError | undefined)?.error ?? `Request failed (${response.status}).`;
    throw new ApiRequestError(message, response.status);
  }
  return body as T;
}

export const butchApi: ButchApi = {
  chat: (body) => request<ChatResponse>('/chat', { method: 'POST', body: JSON.stringify(body) }),
  sendFeedback: (body) =>
    request<FeedbackResponse>('/feedback', { method: 'POST', body: JSON.stringify(body) }),
  quickPrompts: async () => (await request<QuickPromptsResponse>('/quick-prompts')).prompts,
};
