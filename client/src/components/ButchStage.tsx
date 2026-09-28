import type { ButchPose } from '@butch/shared';
import { MascotAvatar } from './MascotAvatar.tsx';

/** A quick shout under Butch for each pose. */
const CAPTIONS: Record<ButchPose, string> = {
  idle: 'Go Cougs!',
  wave: 'Hey hey, Coug!',
  thinking: 'Hmm, lemme think…',
  hype: 'LET’S GOOO!',
  point: 'Right this way!',
  flex: 'Cougar strong!',
  study: 'Hitting the books!',
  shrug: 'Stumped this time!',
  thumbsup: 'You got it!',
};

interface ButchStageProps {
  /** The pose from Butch's latest reply. */
  pose: ButchPose;
  busy: boolean;
  /** Changes with every new reply, so Butch talks again even if the pose repeats. */
  replyKey: string;
}

/**
 * Full-body, costumed Butch next to the chat on wide screens (US-06). He acts
 * out each reply and flaps his mouth as it arrives. Hidden on phones, where
 * the header avatar shows his expression instead. Purely decorative.
 */
export function ButchStage({ pose, busy, replyKey }: ButchStageProps) {
  const shown: ButchPose = busy ? 'thinking' : pose;
  return (
    <aside
      aria-hidden="true"
      data-testid="butch-stage"
      className="hidden w-64 shrink-0 flex-col items-center justify-end border-r border-wsu-black-30 bg-white px-4 pb-10 lg:flex xl:w-80"
    >
      <p
        key={shown}
        className="relative mb-4 rounded-2xl border-2 border-wsu-crimson bg-white px-4 py-2 text-center text-lg font-extrabold text-wsu-crimson shadow-sm"
      >
        {CAPTIONS[shown]}
        {/* Speech-bubble tail */}
        <span className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-wsu-crimson bg-white" />
      </p>
      {/* Remounting on each reply replays the (finite) mouth-flap animation. */}
      <MascotAvatar
        key={replyKey}
        variant="full"
        pose={pose}
        state={busy ? 'thinking' : 'idle'}
        animated
        talking={!busy}
        className="aspect-[200/280] h-72 xl:h-80"
      />
    </aside>
  );
}
