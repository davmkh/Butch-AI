import { useId } from 'react';
import type { ButchPose } from '@butch/shared';

/** Whether Butch is busy writing a reply. Kept separate from the pose for the typing tests (US-06). */
export type MascotState = 'idle' | 'thinking';

const HEAD_SIZES = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-20 w-20',
} as const;

interface MascotAvatarProps {
  /** What Butch is acting out. Ignored while `state` is "thinking". */
  pose?: ButchPose;
  state?: MascotState;
  /** `head`: a round close-up for bubbles and the header. `full`: Butch in costume, head to sneakers. */
  variant?: 'head' | 'full';
  /** Head size. For `full`, size it with `className` instead. */
  size?: keyof typeof HEAD_SIZES;
  /** Loop the pose's animation (bounce, wave, jump...). Off for the small bubble avatars. */
  animated?: boolean;
  /** Flap the mouth, e.g. right after a new reply arrives. */
  talking?: boolean;
  className?: string;
}

/**
 * Butch in costume (US-06): crimson jersey, gray pants, big cougar head. He
 * acts out each reply with a pose the server picks (a wave to say hi, a flex
 * for the Rec, a book for deadlines, a shrug when he can't answer).
 *
 * ORIGINAL ART, not the official Butch logo or costume photos (WSU
 * trademarks). One drawing serves both variants: `head` just crops the view.
 *
 * Decorative for screen readers: the reply text and "Butch is typing…" carry
 * the meaning. Animations only run when the user hasn't asked for reduced motion.
 */
export function MascotAvatar({
  pose = 'idle',
  state = 'idle',
  variant = 'head',
  size = 'md',
  animated = false,
  talking = false,
  className = '',
}: MascotAvatarProps) {
  const current: ButchPose = state === 'thinking' ? 'thinking' : pose;
  const look = LOOKS[current];
  const arms = ARMS[current];
  const isHead = variant === 'head';
  const bodyMotion = animated ? BODY_MOTION[current] : '';
  const clipId = `butch-clip${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <span
      aria-hidden="true"
      data-testid="butch-avatar"
      data-state={state}
      data-pose={current}
      className={`inline-block shrink-0 ${isHead ? HEAD_SIZES[size] : ''} ${
        isHead && state === 'thinking' ? 'motion-safe:animate-butch-bob' : ''
      } ${className}`}
    >
      <svg viewBox={isHead ? '38 2 124 124' : '0 0 200 280'} className="h-full w-full">
        {isHead && (
          <>
            {/* White ring keeps the avatar visible on the crimson header */}
            <circle cx="100" cy="64" r="62" fill="#ffffff" />
            <circle cx="100" cy="64" r="58" fill="#a60f2d" />
            <clipPath id={clipId}>
              <circle cx="100" cy="64" r="58" />
            </clipPath>
          </>
        )}
        <g
          className={bodyMotion}
          style={ORIGIN_FEET}
          clipPath={isHead ? `url(#${clipId})` : undefined}
        >
          {!isHead && <Body />}
          {current === 'study' && <Book />}
          <g
            className={animated && current === 'thinking' ? 'motion-safe:animate-butch-bob' : ''}
            style={ORIGIN_NECK}
          >
            <g transform={look.tilt ? `rotate(${look.tilt} 100 112)` : undefined}>
              <Head look={look} talking={talking} />
            </g>
          </g>
          <Arm side="left" elbow={arms.left[0]} hand={arms.left[1]} />
          <g
            className={animated && current === 'wave' ? 'motion-safe:animate-butch-wave' : ''}
            style={ORIGIN_RIGHT_SHOULDER}
          >
            <Arm
              side="right"
              elbow={arms.right[0]}
              hand={arms.right[1]}
              finger={current === 'point'}
              thumb={current === 'thumbsup'}
            />
          </g>
        </g>
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Poses
// ---------------------------------------------------------------------------

type Point = [x: number, y: number];
/** Shoulders are fixed; each arm is an elbow and a hand. */
type ArmPose = { left: [elbow: Point, hand: Point]; right: [elbow: Point, hand: Point] };

const SHOULDER = { left: [70, 128] as Point, right: [130, 128] as Point };
const ARMS_DOWN: ArmPose = {
  left: [
    [60, 158],
    [64, 186],
  ],
  right: [
    [140, 158],
    [136, 186],
  ],
};

const ARMS: Record<ButchPose, ArmPose> = {
  idle: ARMS_DOWN,
  wave: {
    left: ARMS_DOWN.left,
    right: [
      [158, 108],
      [166, 74],
    ],
  },
  thinking: {
    left: [
      [62, 160],
      [104, 164],
    ],
    right: [
      [148, 152],
      [114, 112],
    ],
  },
  hype: {
    left: [
      [46, 104],
      [38, 66],
    ],
    right: [
      [154, 104],
      [162, 66],
    ],
  },
  point: {
    left: [
      [48, 152],
      [68, 176],
    ],
    right: [
      [160, 122],
      [186, 112],
    ],
  },
  flex: {
    left: [
      [40, 130],
      [46, 96],
    ],
    right: [
      [160, 130],
      [154, 96],
    ],
  },
  study: {
    left: [
      [58, 170],
      [80, 152],
    ],
    right: [
      [142, 170],
      [120, 152],
    ],
  },
  shrug: {
    left: [
      [48, 150],
      [34, 128],
    ],
    right: [
      [152, 150],
      [166, 128],
    ],
  },
  thumbsup: {
    left: ARMS_DOWN.left,
    right: [
      [160, 148],
      [150, 116],
    ],
  },
};

interface Look {
  brows: 'neutral' | 'raised' | 'determined' | 'worried' | 'quizzical';
  eyes: 'open' | 'happy';
  /** Where the pupils point, in pixels from center. */
  gaze?: Point;
  mouth: 'smile' | 'open' | 'o' | 'grin' | 'wavy';
  blush?: boolean;
  /** Head tilt in degrees. */
  tilt?: number;
}

const LOOKS: Record<ButchPose, Look> = {
  idle: { brows: 'neutral', eyes: 'open', mouth: 'smile' },
  wave: { brows: 'raised', eyes: 'open', mouth: 'open', blush: true },
  thinking: { brows: 'quizzical', eyes: 'open', gaze: [3, -4], mouth: 'o', tilt: 6 },
  hype: { brows: 'raised', eyes: 'happy', mouth: 'open', blush: true },
  point: { brows: 'raised', eyes: 'open', gaze: [4, 0], mouth: 'grin' },
  flex: { brows: 'determined', eyes: 'open', mouth: 'grin' },
  study: { brows: 'neutral', eyes: 'open', gaze: [0, 4], mouth: 'smile' },
  shrug: { brows: 'worried', eyes: 'open', mouth: 'wavy', tilt: -7 },
  thumbsup: { brows: 'raised', eyes: 'happy', mouth: 'grin', blush: true },
};

/** Butch never really stands still. */
const BODY_MOTION: Record<ButchPose, string> = {
  idle: 'motion-safe:animate-butch-bounce',
  wave: 'motion-safe:animate-butch-bounce',
  thinking: '',
  hype: 'motion-safe:animate-butch-jump',
  point: 'motion-safe:animate-butch-bounce',
  flex: 'motion-safe:animate-butch-flex',
  study: '',
  shrug: 'motion-safe:animate-butch-shrug',
  thumbsup: 'motion-safe:animate-butch-bounce',
};

// SVG transforms default to the top-left corner; these pivot on the right spot.
const ORIGIN_FEET = { transformOrigin: '100px 262px' };
const ORIGIN_NECK = { transformOrigin: '100px 112px' };
const ORIGIN_RIGHT_SHOULDER = { transformOrigin: '130px 128px' };

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const C = {
  crimson: '#a60f2d',
  gray: '#4d4d4d',
  fur: '#d4ae83',
  furDark: '#b08d66',
  furDeep: '#6b4f36',
  cream: '#f6ebdd',
  ink: '#2b1d14',
  mouth: '#5c1020',
  tongue: '#e8828f',
};

function Body() {
  return (
    <>
      <ellipse cx="100" cy="266" rx="54" ry="7" fill="#000000" opacity="0.12" />
      {/* Tail */}
      <path
        d="M128 196 C160 202 174 182 166 162 C162 150 168 140 178 141"
        fill="none"
        stroke={C.fur}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="178" cy="141" r="6" fill={C.furDeep} />
      {/* Legs and sneakers */}
      <rect x="74" y="192" width="22" height="60" rx="9" fill={C.gray} />
      <rect x="104" y="192" width="22" height="60" rx="9" fill={C.gray} />
      <ellipse cx="82" cy="255" rx="18" ry="8" fill="#ffffff" stroke={C.gray} strokeWidth="2" />
      <ellipse cx="118" cy="255" rx="18" ry="8" fill="#ffffff" stroke={C.gray} strokeWidth="2" />
      <path d="M68 252 h24 M108 252 h24" stroke={C.crimson} strokeWidth="3" strokeLinecap="round" />
      {/* Jersey */}
      <path
        d="M64 134 Q64 118 82 116 L118 116 Q136 118 136 134 L134 204 Q100 212 66 204 Z"
        fill={C.crimson}
      />
      <path
        d="M88 116 L100 129 L112 116"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M67 196 Q100 204 133 196" fill="none" stroke="#ffffff" strokeWidth="3" />
      <text
        x="100"
        y="170"
        textAnchor="middle"
        fontFamily="Montserrat Variable, sans-serif"
        fontSize="17"
        fontWeight="800"
        fill="#ffffff"
        letterSpacing="1"
      >
        COUGS
      </text>
    </>
  );
}

function Book() {
  return (
    <g strokeLinejoin="round">
      <path d="M72 132 L100 137 L128 132 L128 162 L100 167 L72 162 Z" fill={C.crimson} />
      <path
        d="M100 139 L76 135 L76 158 L100 163 Z"
        fill="#ffffff"
        stroke={C.gray}
        strokeWidth="1"
      />
      <path
        d="M100 139 L124 135 L124 158 L100 163 Z"
        fill="#ffffff"
        stroke={C.gray}
        strokeWidth="1"
      />
      <path
        d="M81 142 L95 144 M81 148 L95 150 M105 144 L119 142 M105 150 L119 148"
        stroke={C.gray}
        strokeWidth="1.2"
      />
    </g>
  );
}

function Head({ look, talking }: { look: Look; talking: boolean }) {
  const [gx, gy] = look.gaze ?? [0, 0];
  return (
    <>
      {/* Ears */}
      <g fill={C.fur} stroke={C.fur} strokeWidth="6" strokeLinejoin="round">
        <path d="M58 48 L56 14 L86 32 Z" />
        <path d="M142 48 L144 14 L114 32 Z" />
      </g>
      <g fill={C.furDeep}>
        <path d="M63 39 L62 22 L78 32 Z" />
        <path d="M137 39 L138 22 L122 32 Z" />
      </g>
      {/* Head, muzzle, and cougar tear marks */}
      <ellipse cx="100" cy="68" rx="48" ry="44" fill={C.fur} />
      <ellipse cx="100" cy="92" rx="26" ry="18" fill={C.cream} />
      <path
        d="M84 73 Q78 80 76 88 M116 73 Q122 80 124 88"
        fill="none"
        stroke={C.furDeep}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {look.blush && (
        <g fill={C.tongue} opacity="0.55">
          <ellipse cx="70" cy="84" rx="7" ry="4" />
          <ellipse cx="130" cy="84" rx="7" ry="4" />
        </g>
      )}
      {/* Eyes */}
      {look.eyes === 'happy' ? (
        <path
          d="M71 64 Q82 52 93 64 M107 64 Q118 52 129 64"
          fill="none"
          stroke={C.ink}
          strokeWidth="4"
          strokeLinecap="round"
        />
      ) : (
        <>
          <ellipse cx="82" cy="62" rx="11" ry="12" fill="#ffffff" />
          <ellipse cx="118" cy="62" rx="11" ry="12" fill="#ffffff" />
          <g transform={`translate(${gx} ${gy})`}>
            <circle cx="82" cy="63" r="6" fill={C.ink} />
            <circle cx="118" cy="63" r="6" fill={C.ink} />
            <circle cx="84" cy="60.5" r="2" fill="#ffffff" />
            <circle cx="120" cy="60.5" r="2" fill="#ffffff" />
          </g>
        </>
      )}
      <path
        d={BROWS[look.brows]}
        fill="none"
        stroke={C.furDeep}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Nose, whiskers, mouth */}
      <path d="M93 80 Q100 76 107 80 Q104 87 100 88 Q96 87 93 80 Z" fill={C.ink} />
      <g fill={C.furDark}>
        <circle cx="89" cy="93" r="1.4" />
        <circle cx="85" cy="89" r="1.4" />
        <circle cx="111" cy="93" r="1.4" />
        <circle cx="115" cy="89" r="1.4" />
      </g>
      <g
        className={talking ? 'motion-safe:animate-butch-talk' : ''}
        style={{ transformOrigin: '100px 94px' }}
      >
        <Mouth shape={look.mouth} />
      </g>
    </>
  );
}

const BROWS: Record<Look['brows'], string> = {
  neutral: 'M72 46 Q82 42 92 46 M108 46 Q118 42 128 46',
  raised: 'M72 41 Q82 36 92 41 M108 41 Q118 36 128 41',
  determined: 'M72 42 L92 49 M128 42 L108 49',
  worried: 'M72 48 L92 42 M128 48 L108 42',
  quizzical: 'M72 46 Q82 43 92 46 M108 40 Q118 34 128 40',
};

function Mouth({ shape }: { shape: Look['mouth'] }) {
  const line = { fill: 'none', stroke: C.ink, strokeWidth: 3, strokeLinecap: 'round' as const };
  switch (shape) {
    case 'smile':
      return <path d="M88 95 Q100 105 112 95" {...line} />;
    case 'wavy':
      return <path d="M88 99 Q94 95 100 99 Q106 103 112 99" {...line} />;
    case 'o':
      return <ellipse cx="100" cy="99" rx="4.5" ry="5.5" fill={C.mouth} />;
    case 'grin':
      return (
        <path
          d="M86 93 Q100 97 114 93 Q111 105 100 106 Q89 105 86 93 Z"
          fill="#ffffff"
          stroke={C.ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      );
    case 'open':
      return (
        <>
          <path d="M86 93 Q100 96 114 93 Q112 111 100 112 Q88 111 86 93 Z" fill={C.mouth} />
          <ellipse cx="100" cy="106" rx="7" ry="4" fill={C.tongue} />
        </>
      );
  }
}

function Arm({
  side,
  elbow,
  hand,
  finger = false,
  thumb = false,
}: {
  side: 'left' | 'right';
  elbow: Point;
  hand: Point;
  finger?: boolean;
  thumb?: boolean;
}) {
  const [sx, sy] = SHOULDER[side];
  const [ex, ey] = elbow;
  const [hx, hy] = hand;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Jersey sleeve, then furry forearm */}
      <path d={`M${sx} ${sy} L${ex} ${ey}`} stroke={C.crimson} strokeWidth="17" />
      <path d={`M${ex} ${ey} L${hx} ${hy}`} stroke={C.fur} strokeWidth="13" />
      {finger && <path d={`M${hx} ${hy} L${hx + 11} ${hy - 3}`} stroke={C.fur} strokeWidth="6" />}
      {thumb && (
        <path d={`M${hx - 2} ${hy} L${hx - 2} ${hy - 13}`} stroke={C.fur} strokeWidth="6" />
      )}
      <circle cx={hx} cy={hy} r="9" fill={C.fur} stroke={C.furDark} strokeWidth="1.5" />
    </g>
  );
}
