import { useEffect, useRef } from 'react';
import type { Rating } from '@butch/shared';
import type { ChatMessage, ChatStatus } from '../hooks/useChat.ts';
import { MascotAvatar } from './MascotAvatar.tsx';
import { MessageBubble } from './MessageBubble.tsx';
import { TypingIndicator } from './TypingIndicator.tsx';

interface ChatWindowProps {
  messages: ChatMessage[];
  status: ChatStatus;
  onRate: (messageId: string, rating: Rating) => void;
}

/**
 * The scrollable conversation (FR-02, FR-07). It's an ARIA live "log", so
 * screen readers announce each new message and the typing indicator (NFR-05).
 */
export function ChatWindow({ messages, status, onRate }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Bring the newest message into view. If it's taller than the window (a long
  // reply), show its beginning instead of its end so it reads top-down.
  useEffect(() => {
    const container = scrollRef.current;
    const newest = listRef.current?.lastElementChild;
    if (!container || !(newest instanceof HTMLElement)) return;
    const fits = newest.offsetHeight <= container.clientHeight;
    container.scrollTop = fits ? container.scrollHeight : newest.offsetTop - 16;
  }, [messages, status]);

  const isFreshConversation = messages.length === 1 && messages[0]?.kind === 'greeting';

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation with Butch"
      // Focusable so keyboard users can scroll back through history.
      tabIndex={0}
      // `relative` makes this the offsetParent, so offsetTop above is measured from here.
      className="relative min-h-0 flex-1 overflow-y-auto focus-visible:outline-offset-[-2px]"
    >
      <div ref={listRef} className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {isFreshConversation && <Intro />}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onRate={onRate} />
        ))}
        {status === 'thinking' && <TypingIndicator />}
      </div>
    </div>
  );
}

function Intro() {
  return (
    <div className="flex flex-col items-center pt-2 pb-4 text-center">
      <MascotAvatar size="lg" />
      <h2 className="mt-3 text-2xl font-bold text-wsu-crimson">Ask me anything about WSU</h2>
      <p className="mt-1 max-w-md text-wsu-gray">
        Dining hours, academic deadlines, admissions, the Rec, and campus life. I answer from
        official WSU websites and link my sources.
      </p>
    </div>
  );
}
