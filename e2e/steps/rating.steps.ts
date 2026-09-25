import { expect } from '@playwright/test';
import type { ChatPage } from './chatPage.ts';
import { Given, Then, When, type ScenarioState } from './fixtures.ts';

// US-07: Rate Butch's responses

/** Clicks a thumb on Butch's latest reply and records what the server said. */
async function rate(chat: ChatPage, state: ScenarioState, name: 'Thumbs up' | 'Thumbs down') {
  const [response] = await Promise.all([
    chat.page.waitForResponse('**/api/feedback'),
    chat.lastReply.getByRole('button', { name }).click(),
  ]);
  const { messageId, rating } = response.request().postDataJSON();
  state.feedback.push({ status: response.status(), messageId, rating });
}

Given('Butch has responded to my question', async ({ chat }) => {
  await chat.ask('When is Family Weekend?');
});

Given('I already rated a response with a thumbs-up', async ({ chat, state }) => {
  await chat.ask('When is Family Weekend?');
  await rate(chat, state, 'Thumbs up');
});

When('I click the thumbs-up icon on that response', async ({ chat, state }) => {
  await rate(chat, state, 'Thumbs up');
});

When('I click the thumbs-down icon on the same response', async ({ chat, state }) => {
  await rate(chat, state, 'Thumbs down');
});

Then('the rating is recorded', async ({ state }) => {
  expect(state.feedback.at(-1)).toMatchObject({ status: 200, rating: 'up' });
});

Then('the thumbs-up icon is shown as selected', async ({ chat }) => {
  await expect(chat.lastReply.getByRole('button', { name: 'Thumbs up' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

Then('the rating updates to thumbs-down', async ({ chat, state }) => {
  expect(state.feedback.at(-1)).toMatchObject({ status: 200, rating: 'down' });
  await expect(chat.lastReply.getByRole('button', { name: 'Thumbs down' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

Then('only one rating is recorded per response', async ({ chat, state }) => {
  await expect(chat.lastReply.getByRole('button', { name: 'Thumbs up' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  // Both clicks rated the same reply; the server keeps one rating per reply
  // (replacing, not adding). See "US-07" in server/src/app.test.ts.
  expect(new Set(state.feedback.map((f) => f.messageId)).size).toBe(1);
});
