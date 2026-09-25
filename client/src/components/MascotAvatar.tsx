export type MascotState = 'idle' | 'thinking';

const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-20 w-20',
} as const;

interface MascotAvatarProps {
  state?: MascotState;
  size?: keyof typeof SIZES;
}

/**
 * Butch's avatar (US-06). While Butch is writing a reply it switches to the
 * "thinking" state (a head bob, eyes glancing up), then returns to "idle".
 *
 * PLACEHOLDER ART: a simple original cougar face, not the official Butch logo
 * (a WSU trademark). When the team has Lottie animations (Milestone 1,
 * section 2.1.5), render them here with lottie-react and keep this same
 * `state` prop so nothing else changes.
 *
 * Decorative for screen readers: the "Butch is typing…" text carries the state.
 * The bob animation only runs when the user hasn't asked for reduced motion.
 */
export function MascotAvatar({ state = 'idle', size = 'md' }: MascotAvatarProps) {
  const thinking = state === 'thinking';
  return (
    <span
      aria-hidden="true"
      data-testid="butch-avatar"
      data-state={state}
      className={`inline-block shrink-0 ${SIZES[size]} ${thinking ? 'motion-safe:animate-butch-bob' : ''}`}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        {/* White ring keeps the avatar visible on the crimson header */}
        <circle cx="32" cy="32" r="32" fill="#ffffff" />
        <circle cx="32" cy="32" r="29" fill="#a60f2d" />
        {/* Ears */}
        <g fill="#d4ae83" stroke="#d4ae83" strokeWidth="3" strokeLinejoin="round">
          <path d="M15 26 17.5 10 30 19Z" />
          <path d="M49 26 46.5 10 34 19Z" />
        </g>
        <g fill="#8a6a4a">
          <path d="M18.8 21 20 14.5 25.8 18.6Z" />
          <path d="M45.2 21 44 14.5 38.2 18.6Z" />
        </g>
        {/* Head and muzzle */}
        <ellipse cx="32" cy="35" rx="18" ry="16" fill="#d4ae83" />
        <ellipse cx="32" cy="42.5" rx="9.5" ry="6.5" fill="#f6ebdd" />
        {/* Eyes: glance up and to the side while thinking */}
        <g transform={thinking ? 'translate(1.2 -1.4)' : undefined} fill="#1f1f1f">
          <ellipse cx="25" cy="32" rx="2.4" ry="2.9" />
          <ellipse cx="39" cy="32" rx="2.4" ry="2.9" />
          <circle cx="25.8" cy="31" r="0.8" fill="#ffffff" />
          <circle cx="39.8" cy="31" r="0.8" fill="#ffffff" />
        </g>
        {/* Nose and smile */}
        <path d="M29 38.6h6l-3 3.2Z" fill="#4d4d4d" stroke="#4d4d4d" strokeLinejoin="round" />
        <path
          d="M32 41.8v1.9m0 0q-2 2-3.8.6m3.8-.6q2 2 3.8.6"
          fill="none"
          stroke="#4d4d4d"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
