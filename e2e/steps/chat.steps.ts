import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { Given, Then, When } from './fixtures.ts';

// ---------------------------------------------------------------------------
// Opening the page and asking questions (US-01, US-02, US-03, US-04)
// ---------------------------------------------------------------------------

Given('I am on the Butch chatbot page', async ({ chat }) => chat.open());
Given('I load the Butch chatbot page', async ({ chat }) => chat.open());
Given('the user is on the chat page', async ({ chat }) => chat.open());

When('I type {string} in the response bar', async ({ chat, state }, text: string) => {
  state.typedQuestion = text;
  await chat.input.fill(text);
});

When('I click the {string} button', async ({ page }, name: string) => {
  const button = page.getByRole('button', { name, exact: true });
  // A user can still click a button that only *looks* disabled (aria-disabled keeps it
  // focusable), so force the click instead of waiting for it to become enabled.
  const looksDisabled = (await button.getAttribute('aria-disabled')) === 'true';
  await button.click({ force: looksDisabled });
});

When('I press Enter', async ({ chat }) => chat.input.press('Enter'));

When('the user asks {string}', async ({ chat }, question: string) => chat.ask(question));

Then('my message appears as a new chat bubble', async ({ chat, state }) => {
  await expect(chat.userBubbles.filter({ hasText: state.typedQuestion })).toHaveCount(1);
});

Given('the response bar is empty', async ({ chat, state }) => {
  await expect(chat.input).toHaveValue('');
  state.bubbleCountBefore = await chat.bubbles.count();
});

Then('no new chat bubble is added to the conversation', async ({ chat, state }) => {
  // Give a wrongly-sent message a moment to show up before checking.
  await chat.page.waitForTimeout(300);
  await expect(chat.bubbles).toHaveCount(state.bubbleCountBefore!);
});

// ---------------------------------------------------------------------------
// Butch's replies
// ---------------------------------------------------------------------------

Then(
  'Butch responds with a specific range of dates that match the knowledge base',
  async ({ chat }) => {
    await expect(chat.lastReply).toContainText('Friday, October 2 through Sunday, October 4, 2026');
  },
);

Then('will include a link to the actual Parents Weekend information website', async ({ chat }) => {
  await expect(chat.lastReply.getByRole('link', { name: /Family Weekends/ })).toHaveAttribute(
    'href',
    'https://family.wsu.edu/family-weekends/',
  );
});

Then('Butch responds with a fallback message instead of guessing', async ({ chat }) => {
  await expect(chat.lastReply).toContainText("I'd rather not guess");
});

Then(
  'the response includes at least one working link to a WSU help resource',
  async ({ chat, request }) => {
    const hrefs = await chat.lastReply
      .getByRole('link')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/([a-z0-9-]+\.)*wsu\.edu\//);

    // Actually visiting the links needs the internet, so it's opt-in: E2E_CHECK_LINKS=1
    if (process.env.E2E_CHECK_LINKS) {
      for (const href of hrefs) expect((await request.get(href)).status()).toBeLessThan(400);
    }
  },
);

Then('Butch responds that Southside is currently open', async ({ chat }) => {
  await expect(chat.lastReply).toContainText('Southside Café: open right now');
});

Then(
  "the response includes today's closing time of {word} {word}",
  async ({ chat }, time: string, ampm: string) => {
    await expect(chat.lastReply).toContainText(`closing at ${time} ${ampm} today`);
  },
);

Then('Butch responds that Southside is currently closed', async ({ chat }) => {
  await expect(chat.lastReply).toContainText('Southside Café: closed right now');
});

Then('the response includes the times and days that Southside is open', async ({ chat }) => {
  await expect(chat.lastReply).toContainText('Mon–Fri 7:30 AM–9:00 PM; Sat–Sun 8:30 AM–9:00 PM');
});

Then('Butch responds with a specific date for the deadline to drop classes', async ({ chat }) => {
  await expect(chat.lastReply).toContainText('Tuesday, September 22, 2026');
});

Then("the date matches the current semester's academic calendar", async ({ chat }) => {
  await expect(chat.lastReply).toContainText('Fall 2026 deadline to drop a course');
  await expect(chat.lastReply).toContainText('21 days from today');
});

Then('Butch responds that the drop deadline has already passed', async ({ chat }) => {
  await expect(chat.lastReply).toContainText('already passed');
});

Then("includes a link to the Registrar's Office for late withdrawal options", async ({ chat }) => {
  await expect(chat.lastReply).toContainText('late withdrawal options');
  await expect(
    chat.lastReply.getByRole('link', { name: /Office of the Registrar/ }),
  ).toHaveAttribute('href', 'https://registrar.wsu.edu/contact-us/');
});

Then('Butch responds with information about student life at WSU', async ({ chat }) => {
  await expect(chat.lastReply).toContainText('student organizations');
});

// ---------------------------------------------------------------------------
// Quick prompts (US-05)
// ---------------------------------------------------------------------------

const sitePrompts: { prompt: string }[] = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../server/data/quick-prompts.json'), 'utf8'),
).prompts;

Given('the {string} button is visible', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
});

When('the user clicks the {string} button', async ({ page, state }, name: string) => {
  state.typedQuestion = name;
  await page.getByRole('button', { name, exact: true }).click();
});

Then('that chat is sent as a user message without typing anything', async ({ chat, state }) => {
  await expect(chat.userBubbles.last()).toContainText(state.typedQuestion!);
  await expect(chat.input).toHaveValue('');
});

Given('I am a returning user with prior chat history', async ({ chat, state }) => {
  state.askedQuestion = 'How do I get a Cougar Card?';
  await chat.ask(state.askedQuestion);
});

Given('I am a new user with no chat history', async () => {
  // Every scenario starts in a fresh browser context, so there's no saved history.
});

When('the chatbot page loads', async ({ chat }) => chat.open());

Then(
  'the quick-reply buttons include at least one question relevant to my prior activity',
  async ({ chat, state }) => {
    await expect(chat.quickPrompts.first()).toContainText(state.askedQuestion!);
  },
);

Then('the quick-reply buttons show the site-wide most-asked questions', async ({ chat }) => {
  await expect(chat.quickPrompts).toHaveText(sitePrompts.map((p) => p.prompt));
});

// ---------------------------------------------------------------------------
// New conversation (US-10)
// ---------------------------------------------------------------------------

const QUESTIONS = ['When is Family Weekend?', 'When is spring break?', 'Tell me about campus life'];

Given(
  'I have an active conversation with {int} exchanged messages',
  async ({ chat }, count: number) => {
    await chat.open();
    for (let i = 0; (await chat.bubbles.count()) < count; i++) {
      await chat.ask(QUESTIONS[i % QUESTIONS.length]!);
    }
  },
);

When('I click {string}', async ({ page }, name: string) => {
  await page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') }).click();
});

Then('the chat window is cleared', async ({ chat }) => {
  await expect(chat.bubbles).toHaveCount(1);
  await expect(chat.userBubbles).toHaveCount(0);
});

Then("I see Butch's default greeting message", async ({ chat }) => {
  await expect(chat.bubbles.first()).toContainText("Hey there, Coug! I'm Butch.");
});
