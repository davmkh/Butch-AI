import { MascotAvatar } from './MascotAvatar.tsx';

/** Shown while Butch writes a reply (FR-04, US-06). */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" data-testid="typing-indicator">
      <MascotAvatar size="sm" state="thinking" />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-wsu-black-30 bg-white px-4 py-3 shadow-sm">
        <span className="text-sm text-wsu-gray">Butch is typing…</span>
        <span aria-hidden="true" className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-wsu-crimson motion-safe:animate-typing-dot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
