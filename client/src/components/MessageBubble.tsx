import type { Rating, SourceLink } from '@butch/shared';
import type { ChatMessage } from '../hooks/useChat.ts';
import { ExternalLinkIcon } from './icons.tsx';
import { MascotAvatar } from './MascotAvatar.tsx';
import { RatingButtons } from './RatingButtons.tsx';

interface MessageBubbleProps {
  message: ChatMessage;
  onRate: (messageId: string, rating: Rating) => void;
}

/** One chat bubble (FR-02): the user on the right in crimson, Butch on the left in white. */
export function MessageBubble({ message, onRate }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end" data-testid="message" data-role="user">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-wsu-crimson px-4 py-2.5 text-white shadow-sm">
          <p className="break-words whitespace-pre-wrap">
            <span className="sr-only">You said: </span>
            {message.text}
          </p>
        </div>
      </div>
    );
  }

  const isError = message.kind === 'error';
  return (
    <div className="flex items-end gap-2" data-testid="message" data-role="butch">
      <MascotAvatar size="sm" pose={message.pose} />
      <div
        className={`max-w-[85%] rounded-2xl rounded-bl-md border bg-white px-4 py-3 shadow-sm ${
          isError ? 'border-wsu-crimson' : 'border-wsu-black-30'
        }`}
      >
        <p className="break-words whitespace-pre-wrap">
          <span className="sr-only">Butch said: </span>
          {message.text}
        </p>
        {message.sources && message.sources.length > 0 && (
          <SourceList
            heading={message.kind === 'fallback' ? 'Where to get help' : 'Sources'}
            sources={message.sources}
          />
        )}
        {message.serverId && (
          <RatingButtons rating={message.rating} onRate={(rating) => onRate(message.id, rating)} />
        )}
      </div>
    </div>
  );
}

function SourceList({ heading, sources }: { heading: string; sources: SourceLink[] }) {
  return (
    <div className="mt-3 border-t border-wsu-black-30 pt-2">
      <p className="text-xs font-semibold tracking-wide text-wsu-gray uppercase">{heading}</p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-wsu-crimson underline decoration-1 underline-offset-2 hover:text-wsu-crimson-dark"
            >
              {source.label}
              <ExternalLinkIcon />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
