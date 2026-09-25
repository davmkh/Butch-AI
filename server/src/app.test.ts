import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { ChatResponse } from '@butch/shared';
import { buildTestApp, pullman } from './test/helpers.ts';

async function ask(
  app: Awaited<ReturnType<typeof buildTestApp>>['app'],
  message: string,
  conversationId?: string,
) {
  const res = await request(app).post('/api/chat').send({ message, conversationId });
  return { status: res.status, body: res.body as ChatResponse };
}

describe('POST /api/chat', () => {
  it('US-01: answers a submitted question', async () => {
    const { app } = await buildTestApp();
    const { status, body } = await ask(app, 'What time does the library close?');
    expect(status).toBe(200);
    expect(body.kind).toBe('answer');
    expect(body.reply).toContain('Holland and Terrell Libraries');
    expect(body.conversationId).toMatch(/[0-9a-f-]{36}/);
    expect(body.messageId).toMatch(/[0-9a-f-]{36}/);
  });

  it('US-01: rejects an empty or whitespace-only message', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/chat').send({ message: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  it('rejects overly long messages and malformed JSON', async () => {
    const { app } = await buildTestApp();
    expect(
      (
        await request(app)
          .post('/api/chat')
          .send({ message: 'x'.repeat(501) })
      ).status,
    ).toBe(400);
    const bad = await request(app)
      .post('/api/chat')
      .set('content-type', 'application/json')
      .send('{oops');
    expect(bad.status).toBe(400);
  });

  it('US-02 S1: answers with dates and a link when the knowledge base has the info', async () => {
    const { app } = await buildTestApp();
    const { body } = await ask(app, 'When is Parents Weekend Fall 2026?');
    expect(body.kind).toBe('answer');
    expect(body.reply).toContain('October 2 through Sunday, October 4, 2026');
    expect(body.sources.map((s) => s.url)).toContain('https://family.wsu.edu/family-weekends/');
  });

  it('US-02 S2: falls back with a WSU help link instead of guessing', async () => {
    const { app } = await buildTestApp();
    const { body } = await ask(app, 'How do I get a refund on my parking permit?');
    expect(body.kind).toBe('fallback');
    expect(body.reply).toContain('rather not guess');
    expect(body.sources[0]?.url).toBe('https://transportation.wsu.edu/contact-information/');
    expect(
      body.sources.every((s) => s.url.startsWith('https://') && s.url.includes('wsu.edu')),
    ).toBe(true);
  });

  it('US-03 S1: says Southside is open at noon on a Monday, with the closing time', async () => {
    const { app } = await buildTestApp({ now: pullman('2026-09-21 12:00') });
    const { body } = await ask(app, 'Is Southside open right now?');
    expect(body.reply).toContain('Southside Café: open right now, closing at 9:00 PM today');
  });

  it('US-03 S2: says Southside is closed at midnight and lists its hours', async () => {
    const { app } = await buildTestApp({ now: pullman('2026-09-22 00:00') });
    const { body } = await ask(app, 'Is Southside open right now?');
    expect(body.reply).toContain('Southside Café: closed right now');
    expect(body.reply).toContain('Mon–Fri 7:30 AM–9:00 PM; Sat–Sun 8:30 AM–9:00 PM');
  });

  it('US-04 S1: gives the drop deadline from the current semester when it is still ahead', async () => {
    // Second week of Fall 2026 classes
    const { app } = await buildTestApp({ now: pullman('2026-09-01 10:00') });
    const { body } = await ask(app, 'What is the last day to drop a class?');
    expect(body.reply).toContain('Tuesday, September 22, 2026');
    expect(body.reply).toContain('21 days from today');
  });

  it('US-04 S2: says the drop deadline passed and links to the Registrar', async () => {
    const { app } = await buildTestApp({ now: pullman('2026-09-25 10:00') });
    const { body } = await ask(app, 'What is the last day to drop a class?');
    expect(body.reply).toContain('already passed');
    expect(body.sources.map((s) => s.url)).toContain('https://registrar.wsu.edu/contact-us/');
  });

  it('keeps the same conversation across messages and starts a new one when asked (US-10)', async () => {
    const { app, store } = await buildTestApp();
    const first = await ask(app, 'Tell me about campus life');
    const second = await ask(app, 'How do I get a Cougar Card?', first.body.conversationId);
    expect(second.body.conversationId).toBe(first.body.conversationId);

    // "New conversation" in the UI just omits the ID...
    const fresh = await ask(app, 'When is spring break?');
    expect(fresh.body.conversationId).not.toBe(first.body.conversationId);
    // ...and the earlier conversation is still in the log (US-10 S2).
    expect(await store.recentMessages(first.body.conversationId, 10)).toHaveLength(4);
  });

  it('starts a new conversation if the ID is unknown (e.g. after a server restart)', async () => {
    const { app } = await buildTestApp();
    const unknown = '00000000-0000-4000-8000-000000000000';
    const { body } = await ask(app, 'Tell me about campus life', unknown);
    expect(body.conversationId).not.toBe(unknown);
  });

  it('US-08 / FR-09: logs the question, reply, and time with no personal information', async () => {
    const { app, store } = await buildTestApp();
    const { body } = await ask(app, 'Tell me about campus life');
    const [question, reply] = await store.recentMessages(body.conversationId, 10);

    expect(question).toMatchObject({ role: 'user', text: 'Tell me about campus life' });
    expect(reply).toMatchObject({ role: 'butch', kind: 'answer', entryIds: ['campus-life'] });
    expect(reply?.createdAt).toBeInstanceOf(Date);
    for (const message of [question, reply]) {
      expect(Object.keys(message ?? {}).sort()).toEqual(
        expect.not.arrayContaining(['ip', 'userAgent', 'email', 'name', 'userId']),
      );
    }
  });
});

describe('POST /api/feedback (US-07)', () => {
  it('records a rating and replaces it when changed, keeping one rating per reply', async () => {
    const { app, store } = await buildTestApp();
    const { body } = await ask(app, 'Tell me about campus life');

    const up = await request(app)
      .post('/api/feedback')
      .send({ messageId: body.messageId, rating: 'up' });
    expect(up.status).toBe(200);
    expect(await store.getRating(body.messageId)).toBe('up');

    await request(app).post('/api/feedback').send({ messageId: body.messageId, rating: 'down' });
    expect(await store.getRating(body.messageId)).toBe('down');
  });

  it('rejects unknown messages, user messages, and invalid ratings', async () => {
    const { app, store } = await buildTestApp();
    const { body } = await ask(app, 'Tell me about campus life');
    const [userMessage] = await store.recentMessages(body.conversationId, 10);

    const unknown = await request(app)
      .post('/api/feedback')
      .send({ messageId: '00000000-0000-4000-8000-000000000000', rating: 'up' });
    expect(unknown.status).toBe(404);

    const ratingUser = await request(app)
      .post('/api/feedback')
      .send({ messageId: userMessage?.id, rating: 'up' });
    expect(ratingUser.status).toBe(404);

    const invalid = await request(app)
      .post('/api/feedback')
      .send({ messageId: body.messageId, rating: 'meh' });
    expect(invalid.status).toBe(400);
  });
});

describe('other endpoints', () => {
  it('US-05: lists the FAQ quick prompts', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).get('/api/quick-prompts');
    expect(res.status).toBe(200);
    expect(res.body.prompts.map((p: { prompt: string }) => p.prompt)).toContain(
      'Tell me about campus life',
    );
  });

  it('reports health and 404s unknown API routes', async () => {
    const { app } = await buildTestApp();
    expect((await request(app).get('/api/health')).body).toEqual({
      status: 'ok',
      responder: 'offline',
      storage: 'memory',
    });
    expect((await request(app).get('/api/nope')).status).toBe(404);
  });

  it('rate-limits other API routes too, more loosely than chat', async () => {
    const { app } = await buildTestApp({ rateLimitPerMinute: 1 }); // 5 requests/min for non-chat routes
    const statuses = [];
    for (let i = 0; i < 6; i++)
      statuses.push((await request(app).get('/api/quick-prompts')).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it('rate-limits chat requests per IP', async () => {
    const { app } = await buildTestApp({ rateLimitPerMinute: 2 });
    await ask(app, 'Tell me about campus life');
    await ask(app, 'Tell me about campus life');
    const third = await request(app)
      .post('/api/chat')
      .send({ message: 'Tell me about campus life' });
    expect(third.status).toBe(429);
    expect(third.body.error).toMatch(/Too many questions/);
  });
});

describe('X-Butch-Fake-Now header (end-to-end test hook)', () => {
  const askAtMidnight = (app: Awaited<ReturnType<typeof buildTestApp>>['app']) =>
    request(app)
      .post('/api/chat')
      .set('X-Butch-Fake-Now', '2026-09-22T00:00:00-07:00')
      .send({ message: 'Is Southside open right now?' });

  it('pins "now" for one request when test hooks are on', async () => {
    const { app } = await buildTestApp({ now: pullman('2026-09-21 12:00'), testHooks: true });
    expect((await askAtMidnight(app)).body.reply).toContain('closed right now');
  });

  it('is ignored unless test hooks are explicitly turned on', async () => {
    const { app } = await buildTestApp({ now: pullman('2026-09-21 12:00') });
    expect((await askAtMidnight(app)).body.reply).toContain('open right now');
  });
});
