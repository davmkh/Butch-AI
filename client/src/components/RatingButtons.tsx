import type { ReactNode } from 'react';
import type { Rating } from '@butch/shared';
import { ThumbDownIcon, ThumbUpIcon } from './icons.tsx';

interface RatingButtonsProps {
  rating?: Rating;
  onRate: (rating: Rating) => void;
}

/** Thumbs up/down on one of Butch's replies (FR-08, US-07). Picking the other thumb changes the rating. */
export function RatingButtons({ rating, onRate }: RatingButtonsProps) {
  return (
    <div role="group" aria-label="Rate this answer" className="mt-2 flex items-center gap-1">
      <RateButton label="Thumbs up" selected={rating === 'up'} onClick={() => onRate('up')}>
        <ThumbUpIcon filled={rating === 'up'} />
      </RateButton>
      <RateButton label="Thumbs down" selected={rating === 'down'} onClick={() => onRate('down')}>
        <ThumbDownIcon filled={rating === 'down'} />
      </RateButton>
      {rating && <span className="ml-1 text-xs text-wsu-gray">Thanks for the feedback!</span>}
    </div>
  );
}

function RateButton({
  label,
  selected,
  onClick,
  children,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full p-1.5 transition-colors ${
        selected ? 'bg-wsu-crimson text-white' : 'text-wsu-gray hover:bg-wsu-black-30'
      }`}
    >
      {children}
    </button>
  );
}
