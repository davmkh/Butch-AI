import type { ButchPose, SourceLink } from '@butch/shared';
import { pick } from '../responders/voice.ts';

export interface SmallTalkReply {
  text: string;
  pose: ButchPose;
  sources: SourceLink[];
}

const CRISIS_SUPPORT: SourceLink = {
  label: 'Cougar Health: Crisis Support',
  url: 'https://cougarhealth.wsu.edu/crisis-support/',
};

/**
 * Anything that sounds like someone may be in danger. Checked before
 * everything else, anywhere in the message, and answered calmly (no hype).
 */
const CRISIS =
  /\b(suicid\w*|kill (my ?self|me)|end my life|end it all|want to die|wanna die|hurt(ing)? (my ?self)|self[- ]?harm|(its an|this is an|i have an|having an|theres an|medical|mental health) emergency|^emergency$|in danger|overdos\w*)\b/;

interface Intent {
  /** Matched against the whole message after cleanup, so "hi, when is spring break?" still gets answered. */
  pattern: RegExp;
  pose: ButchPose;
  replies: string[];
}

const INTENTS: Intent[] = [
  {
    pattern:
      /^(hi+|hello+|hey+|heya|hiya|howdy|yo+|sup|whats up|wassup|good (morning|afternoon|evening))( there| again)?$/,
    pose: 'wave',
    replies: [
      'HEY HEY, Coug! So good to see you! What can I help you with? Dining, deadlines, sports, research, the Rec, you name it!',
      'Well hey there, Coug! I’ve been bouncing off the walls waiting for a question. Hit me!',
      'Howdy, Coug! Butch here, fully caffeinated and ready to help. What’s on your mind?',
    ],
  },
  {
    pattern: /^(how are you|how are ya|how r u|hows it going|how you doing|how ya doing|you good)$/,
    pose: 'hype',
    replies: [
      'I’m FANTASTIC, thanks for asking! Every day on the Palouse is a good day. What can I do for you?',
      'Living my best cougar life! Crimson in my veins and a question-answering fire in my heart. What’s up?',
    ],
  },
  {
    pattern:
      /^(thanks+|thank you+( so much| very much)?|thx|ty|tysm|appreciate (it|you)|you rock|youre the best|awesome|nice|perfect|cool)$/,
    pose: 'thumbsup',
    replies: [
      'Anytime, Coug! That’s what I’m here for. Go Cougs! 🐾',
      'You got it! Come back anytime, I’ll be right here bleeding crimson.',
      'Aww, happy to help! Anything else? I’ve got energy for DAYS!',
    ],
  },
  {
    pattern: /^(go+ coug(ar)?s*|go+ coug(ar)?s+ go+|wazzu+|coug it up)$/,
    pose: 'hype',
    replies: [
      'GO COUGS!!! 🐾 Now THAT’S what I like to hear! Once a Coug, always a Coug!',
      'GOOO COUGS! Crimson and gray all day, every day! What can I help you with, Coug?',
    ],
  },
  {
    pattern:
      /^(who are you|what are you|whats your name|who is butch|tell me about (yourself|you)|are you (a bot|real|ai|an ai))$/,
    pose: 'hype',
    replies: [
      'I’m Butch T. Cougar, WSU’s one-and-only mascot and your extremely enthusiastic guide to all things WSU! I’m a student project chatbot that answers from official WSU websites, so I always link my sources. Ask me about dining, deadlines, sports, research, health services, and more. Go Cougs!',
    ],
  },
  {
    pattern:
      /^(help|what can you do|what do you know|what can i ask( you)?|what should i ask|menu|options)$/,
    pose: 'point',
    replies: [
      'Ooh, lots! Try me on dining hours, academic deadlines, admissions, Cougar sports and student tickets, undergrad research and SURCA, tutoring and career help, Cougar Health, housing, the Rec, and campus life. Fire away, Coug!',
    ],
  },
  {
    pattern:
      /^(bye+|goodbye|see ya|see you( later)?|later|cya|peace|gotta go|good night|goodnight)$/,
    pose: 'wave',
    replies: ['See ya later, Coug! Go Cougs! 🐾', 'Bye for now! Stay crimson, Coug!'],
  },
];

/** Lowercase, no punctuation, no "Butch" at the start or end: "Hey Butch!!" -> "hey". */
function clean(message: string): string {
  return message
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^butch\s+|\s+butch$/g, '')
    .trim();
}

/**
 * Greetings, thanks, "Go Cougs!", and other chit-chat that isn't a WSU
 * question. Returns undefined when the message is a real question.
 */
export function smallTalk(message: string): SmallTalkReply | undefined {
  const text = clean(message);
  if (CRISIS.test(text)) {
    return {
      text: 'I’m really glad you reached out. If you’re in danger or this is an emergency, please call 911 right now. You can call or text 988 (the Suicide & Crisis Lifeline) any time, day or night, and WSU’s counseling service (CAPS) has an after-hours line at 509-335-2159. You matter, Coug, and people want to help.',
      pose: 'idle',
      sources: [CRISIS_SUPPORT],
    };
  }
  const intent = INTENTS.find(({ pattern }) => pattern.test(text));
  if (!intent) return undefined;
  return { text: pick(intent.replies, text), pose: intent.pose, sources: [] };
}
