import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { Given, Then, When } from './fixtures.ts';

// NFR-04 (responsive, 320px to 1920px) and NFR-05 (WCAG 2.1 AA, keyboard use)

Then('the page has no detectable WCAG 2.1 AA accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const problems = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} [${v.nodes.map((n) => n.target.join(' ')).join(', ')}]`,
  );
  expect(problems).toEqual([]);
});

When(
  'I tab to the question box and type {string} then press Enter',
  async ({ chat }, text: string) => {
    for (let presses = 0; presses < 25; presses++) {
      if (await chat.input.evaluate((el) => el === document.activeElement)) break;
      await chat.page.keyboard.press('Tab');
    }
    await expect(chat.input).toBeFocused();
    await chat.page.keyboard.type(text);
    await chat.page.keyboard.press('Enter');
  },
);

Given('the screen is {int} pixels wide', async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: 800 });
});

Then("Butch's reply fits on screen without scrolling sideways", async ({ chat, page }) => {
  await expect(chat.lastReply).toBeVisible();
  const sidewaysOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(sidewaysOverflow).toBeLessThanOrEqual(0);

  const box = await chat.lastReply.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});
