import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { ChatRequest } from '@butch/shared';
import App from './App.tsx';
import { GREETING } from './hooks/useChat.ts';
import { chatReply, mockServer, received } from './test/mockServer.ts';

function setup() {
  const user = userEvent.setup();
  render(<App />);
  const input = screen.getByRole('textbox', { name: 'Ask Butch a question' });
  const sendButton = screen.getByRole('button', { name: 'Send' });
  const log = screen.getByRole('log', { name: 'Conversation with Butch' });
  const bubbles = () => within(log).queryAllByTestId('message');
  return { user, input, sendButton, log, bubbles };
}

/** Holds the next /api/chat response until release() is called. */
function holdNextChatReply() {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  mockServer.use(
    http.post(
      '*/api/chat',
      async ({ request }) => {
        const body = (await request.json()) as ChatRequest;
        await gate;
        return HttpResponse.json(chatReply(body));
      },
      { once: true },
    ),
  );
  return release;
}

describe('US-01: submit a question to Butch', () => {
  it('sends with the Send button and shows my message as a new bubble', async () => {
    const { user, input, sendButton, log } = setup();
    await user.type(input, 'What time does the library close?');
    await user.click(sendButton);

    expect(within(log).getByText('What time does the library close?')).toBeInTheDocument();
    expect(
      await within(log).findByText("Here's what I know about: What time does the library close?"),
    ).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('sends with the Enter key, while Shift+Enter adds a new line', async () => {
    const { user, input, log } = setup();
    await user.type(input, 'Line one{Shift>}{Enter}{/Shift}line two');
    expect(input).toHaveValue('Line one\nline two');
    expect(received.chat).toHaveLength(0);

    await user.keyboard('{Enter}');
    expect(await within(log).findByText(/Here's what I know about: Line one/)).toBeInTheDocument();
  });

  it('does not add a bubble when the question box is empty', async () => {
    const { user, input, sendButton, bubbles } = setup();
    expect(bubbles()).toHaveLength(1); // just the greeting

    await user.click(sendButton);
    await user.type(input, '   {Enter}');

    expect(bubbles()).toHaveLength(1);
    expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    expect(received.chat).toHaveLength(0);
  });
});

describe('FR-04 / US-06: typing indicator and mascot animation', () => {
  it('shows "Butch is typing…" and the thinking avatar until the reply arrives', async () => {
    const release = holdNextChatReply();
    const { user, input } = setup();
    const headerAvatar = within(screen.getByRole('banner')).getByTestId('butch-avatar');
    expect(headerAvatar).toHaveAttribute('data-state', 'idle');

    await user.type(input, 'When is spring break?{Enter}');

    expect(await screen.findByText('Butch is typing…')).toBeInTheDocument();
    expect(headerAvatar).toHaveAttribute('data-state', 'thinking');

    release();
    await waitFor(() => expect(screen.queryByText('Butch is typing…')).not.toBeInTheDocument());
    expect(headerAvatar).toHaveAttribute('data-state', 'idle');
  });

  it('acts out each reply with the pose the server picked', async () => {
    const { user, input } = setup();
    const headerAvatar = within(screen.getByRole('banner')).getByTestId('butch-avatar');
    expect(headerAvatar).toHaveAttribute('data-pose', 'wave'); // the greeting

    await user.type(input, 'When is spring break?{Enter}');
    await waitFor(() => expect(headerAvatar).toHaveAttribute('data-pose', 'thumbsup'));
    const [, reply] = within(screen.getByRole('log')).getAllByTestId('butch-avatar');
    expect(reply).toHaveAttribute('data-pose', 'thumbsup');
  });
});

describe('US-02: sources and fallback links', () => {
  it('shows source links that open in a new tab', async () => {
    const { user, input, log } = setup();
    await user.type(input, 'When are finals?{Enter}');

    const link = await within(log).findByRole('link', { name: /WSU Academic Calendar/ });
    expect(link).toHaveAttribute('href', 'https://catalog.wsu.edu/AcademicCalendar');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('labels fallback links as where to get help', async () => {
    mockServer.use(
      http.post('*/api/chat', () =>
        HttpResponse.json({
          conversationId: 'c1',
          messageId: crypto.randomUUID(),
          reply: "I'd rather not guess!",
          kind: 'fallback',
          pose: 'shrug',
          sources: [
            {
              label: 'Transportation Services: Contact',
              url: 'https://transportation.wsu.edu/contact-information/',
            },
          ],
        }),
      ),
    );
    const { user, input, log } = setup();
    await user.type(input, 'How do I get a refund on my parking permit?{Enter}');

    expect(await within(log).findByText('Where to get help')).toBeInTheDocument();
    expect(within(log).getByRole('link', { name: /Transportation Services/ })).toBeInTheDocument();
  });
});

describe('US-05: FAQ quick prompts', () => {
  it('sends a quick prompt as my message without typing', async () => {
    const { user, log } = setup();
    await user.click(await screen.findByRole('button', { name: 'Tell me about campus life' }));

    expect(within(log).getByText('Tell me about campus life')).toBeInTheDocument();
    expect(received.chat.at(-1)?.message).toBe('Tell me about campus life');
  });

  it("puts a returning user's own recent questions first", async () => {
    localStorage.setItem('butch.recentQuestions', JSON.stringify(['How do I get a Cougar Card?']));
    setup();

    const list = await screen.findByRole('list', { name: 'Suggested questions' });
    await within(list).findByRole('button', { name: 'Tell me about campus life' });
    const names = within(list)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names[0]).toContain('How do I get a Cougar Card?');
  });

  it('remembers questions I ask for next time', async () => {
    const { user, input } = setup();
    await user.type(input, 'When is spring break?{Enter}');
    expect(JSON.parse(localStorage.getItem('butch.recentQuestions') ?? '[]')).toEqual([
      'When is spring break?',
    ]);
  });
});

describe('US-07: rate Butch’s responses', () => {
  it('records a thumbs up, then switches it to thumbs down', async () => {
    const { user, input, log } = setup();
    await user.type(input, 'When are finals?{Enter}');

    const thumbsUp = await within(log).findByRole('button', { name: 'Thumbs up' });
    const thumbsDown = within(log).getByRole('button', { name: 'Thumbs down' });

    await user.click(thumbsUp);
    expect(thumbsUp).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(received.feedback.at(-1)?.rating).toBe('up'));

    await user.click(thumbsDown);
    expect(thumbsDown).toHaveAttribute('aria-pressed', 'true');
    expect(thumbsUp).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(received.feedback.at(-1)?.rating).toBe('down'));
    // Both requests rate the same reply, which the server keeps as one rating.
    expect(new Set(received.feedback.map((f) => f.messageId)).size).toBe(1);
  });

  it('does not offer rating buttons on the greeting', () => {
    const { log } = setup();
    expect(within(log).queryByRole('button', { name: 'Thumbs up' })).not.toBeInTheDocument();
  });
});

describe('US-10: start a new conversation', () => {
  it('clears the chat back to the greeting and starts a fresh server conversation', async () => {
    const { user, input, log, bubbles } = setup();
    await user.type(input, 'When are finals?{Enter}');
    await within(log).findByText(/Here's what I know about: When are finals/);
    await user.type(input, 'When is spring break?{Enter}');
    await within(log).findByText(/Here's what I know about: When is spring break/);
    expect(bubbles()).toHaveLength(5);
    expect(received.chat[1]?.conversationId).toBe('conversation-1');

    await user.click(screen.getByRole('button', { name: 'New conversation' }));

    expect(bubbles()).toHaveLength(1);
    expect(within(log).getByText(GREETING)).toBeInTheDocument();

    await user.type(input, 'Tell me about campus life{Enter}');
    await within(log).findByText(/Here's what I know about: Tell me about campus life/);
    expect(received.chat.at(-1)?.conversationId).toBeUndefined();
  });

  it('ignores a reply that arrives after the conversation was reset', async () => {
    const release = holdNextChatReply();
    const { user, input, bubbles } = setup();
    await user.type(input, 'When are finals?{Enter}');
    await user.click(screen.getByRole('button', { name: 'New conversation' }));
    release();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(bubbles()).toHaveLength(1);
  });
});

describe('errors', () => {
  it('shows a friendly message when the server is down', async () => {
    mockServer.use(
      http.post('*/api/chat', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    const { user, input, log } = setup();
    await user.type(input, 'When are finals?{Enter}');
    expect(await within(log).findByText(/couldn't reach the Butch server/)).toBeInTheDocument();
  });

  it('passes along the server’s message for rate limits', async () => {
    mockServer.use(
      http.post('*/api/chat', () =>
        HttpResponse.json(
          { error: 'Whoa there, Coug! Too many questions at once.' },
          { status: 429 },
        ),
      ),
    );
    const { user, input, log } = setup();
    await user.type(input, 'When are finals?{Enter}');
    expect(await within(log).findByText(/Too many questions/)).toBeInTheDocument();
  });
});
