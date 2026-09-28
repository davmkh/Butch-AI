import type { QuickPromptItem } from '../hooks/useQuickPrompts.ts';
import { ClockIcon } from './icons.tsx';

interface QuickReplyBarProps {
  prompts: QuickPromptItem[];
  onPick: (prompt: string) => void;
  busy: boolean;
}

/** One-tap FAQ questions (US-05). Scrolls sideways on narrow screens. */
export function QuickReplyBar({ prompts, onPick, busy }: QuickReplyBarProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <h2 id="quick-prompts-heading" className="sr-only">
        Suggested questions
      </h2>
      <ul
        aria-labelledby="quick-prompts-heading"
        className="flex gap-2 overflow-x-auto px-4 pt-3 pb-2 [scrollbar-color:var(--color-wsu-black-40)_transparent] [scrollbar-width:thin]"
      >
        {prompts.map((item) => (
          <li key={item.id} className="shrink-0">
            <button
              type="button"
              aria-disabled={busy}
              onClick={() => !busy && onPick(item.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-wsu-black-40 bg-white px-3 py-1.5 text-sm font-medium whitespace-nowrap text-wsu-crimson transition-colors hover:border-wsu-crimson aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
            >
              {item.recent && (
                <>
                  <ClockIcon />
                  <span className="sr-only">Recently asked: </span>
                </>
              )}
              {item.prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
