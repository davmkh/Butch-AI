import { expect } from '@playwright/test';
import { Given, Then, When } from './fixtures.ts';

// US-06: WSU theme and Butch typing animation

When('the user submits a response and Butch is typing', async ({ chat }) => {
  await chat.slowDownReplies();
  await chat.input.fill('When is Family Weekend?');
  await chat.input.press('Enter');
  await expect(chat.typingIndicator).toBeVisible();
});

Then('the page shows WSU-themed crimson and gray colors', async ({ page }) => {
  const header = page.getByRole('banner');
  await expect(header).toHaveCSS('background-color', 'rgb(166, 15, 45)'); // WSU crimson #A60F2D
  await expect(header).toHaveCSS('border-bottom-color', 'rgb(77, 77, 77)'); // WSU gray #4D4D4D
});

Then(
  'there is an animation that indicates Butch is typing, with a Butch graphic displayed near the chat window',
  async ({ chat }) => {
    await expect(chat.typingIndicator).toContainText('Butch is typing');
    await expect(chat.typingIndicator.getByTestId('butch-avatar')).toHaveAttribute(
      'data-state',
      'thinking',
    );
  },
);

Given('I have submitted a question', async ({ chat }) => {
  await chat.open();
  await chat.slowDownReplies();
  await chat.input.fill('When is spring break?');
  await chat.input.press('Enter');
});

When('Butch is generating a response', async ({ chat }) => {
  await expect(chat.typingIndicator).toBeVisible();
});

Then('the Butch avatar switches to its "typing" animation or image', async ({ chat }) => {
  await expect(chat.headerAvatar).toHaveAttribute('data-state', 'thinking');
});

Then('the avatar returns to its default state once the response is displayed', async ({ chat }) => {
  await expect(chat.typingIndicator).toBeHidden({ timeout: 10_000 });
  await expect(chat.lastReply).toContainText(/spring/i);
  await expect(chat.headerAvatar).toHaveAttribute('data-state', 'idle');
});
