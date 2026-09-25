import { NewChatIcon } from './icons.tsx';
import { MascotAvatar, type MascotState } from './MascotAvatar.tsx';

interface HeaderProps {
  mascotState: MascotState;
  onNewConversation: () => void;
}

export function Header({ mascotState, onNewConversation }: HeaderProps) {
  return (
    <header className="border-b-4 border-wsu-gray bg-wsu-crimson text-white">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <MascotAvatar state={mascotState} size="md" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg leading-tight font-bold sm:text-xl">Ask Butch</h1>
          <p className="truncate text-xs text-white/90 sm:text-sm">Your Cougar guide to WSU</p>
        </div>
        {/* FR-06 / US-10 */}
        <button
          type="button"
          onClick={onNewConversation}
          aria-label="New conversation"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-white hover:text-wsu-crimson focus-visible:outline-white"
        >
          <NewChatIcon />
          <span className="hidden sm:inline">New conversation</span>
        </button>
      </div>
    </header>
  );
}
