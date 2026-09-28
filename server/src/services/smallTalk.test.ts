import { describe, expect, it } from 'vitest';
import { smallTalk } from './smallTalk.ts';

describe('smallTalk', () => {
  it.each([
    ['Hey Butch!!', 'wave'],
    ['heyyy', 'wave'],
    ['good morning', 'wave'],
    ['thanks butch', 'thumbsup'],
    ['Thank you so much!', 'thumbsup'],
    ['GO COUGS!!!', 'hype'],
    ['gooo cougs', 'hype'],
    ['who are you?', 'hype'],
    ['what can you do', 'point'],
    ['bye!', 'wave'],
  ] as const)('%s -> %s', (message, pose) => {
    expect(smallTalk(message)?.pose).toBe(pose);
  });

  it('leaves real questions for the knowledge base, even with a greeting in front', () => {
    expect(smallTalk('hi, when is spring break?')).toBeUndefined();
    expect(smallTalk('thanks! also when is family weekend')).toBeUndefined();
    expect(smallTalk('Is Southside open right now?')).toBeUndefined();
  });

  it('answers anything that sounds like a crisis calmly, with 911, 988, and a crisis link', () => {
    const reply = smallTalk('i want to die');
    expect(reply?.pose).toBe('idle');
    expect(reply?.text).toContain('911');
    expect(reply?.text).toContain('988');
    expect(reply?.text).not.toMatch(/go cougs/i);
    expect(reply?.sources[0]?.url).toBe('https://cougarhealth.wsu.edu/crisis-support/');
    expect(smallTalk('hey butch this is an emergency')?.text).toContain('911');
  });

  it('does not mistake everyday questions for a crisis', () => {
    expect(smallTalk('how do I end my housing contract')).toBeUndefined();
    expect(smallTalk('how do I get an emergency loan')).toBeUndefined();
  });

  it('always gives the same reply to the same message', () => {
    expect(smallTalk('hello')?.text).toBe(smallTalk('hello')?.text);
  });
});
