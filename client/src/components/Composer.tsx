import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { MAX_QUESTION_LENGTH } from '@butch/shared';
import { SendIcon } from './icons.tsx';

interface ComposerProps {
  onSend: (text: string) => void;
  busy: boolean;
}

const MAX_HEIGHT_PX = 160;

/**
 * Question box (FR-01, US-01). Enter sends and Shift+Enter adds a new line.
 * Empty questions are ignored. The Send button uses aria-disabled rather than
 * `disabled` so it stays focusable and tells screen readers why nothing happens.
 */
export function Composer({ onSend, busy }: ComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = text.trim().length > 0 && !busy;

  // Grow the box with its content, up to a limit. When empty, keep the natural
  // one-line height (measuring then would count a wrapped placeholder).
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    if (text) el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: don't send mid-word for IME users (e.g. typing Japanese or Chinese)
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-2 px-4 pb-2">
      <label htmlFor="butch-question" className="sr-only">
        Ask Butch a question
      </label>
      <textarea
        id="butch-question"
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={MAX_QUESTION_LENGTH}
        placeholder="Ask Butch about WSU…"
        enterKeyHint="send"
        aria-describedby="composer-help"
        className="min-h-11 flex-1 resize-none rounded-2xl border border-wsu-black-40 bg-white px-4 py-2.5 text-base leading-6 placeholder:text-wsu-gray/80 focus-visible:border-wsu-crimson"
      />
      <p id="composer-help" className="sr-only">
        Press Enter to send, or Shift plus Enter for a new line.
      </p>
      <button
        type="submit"
        aria-disabled={!canSend}
        className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 font-semibold text-white transition-colors ${
          canSend
            ? 'bg-wsu-crimson hover:bg-wsu-crimson-dark'
            : 'cursor-not-allowed bg-wsu-black-60'
        }`}
      >
        <SendIcon />
        <span className="sr-only sm:not-sr-only">Send</span>
      </button>
    </form>
  );
}
