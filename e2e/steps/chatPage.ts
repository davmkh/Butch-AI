import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The chat page, located the way a user (or screen reader) finds things: by
 * role and accessible name. If these break, the page probably got less accessible.
 */
export class ChatPage {
  readonly page: Page;
  readonly input: Locator;
  readonly sendButton: Locator;
  readonly log: Locator;
  readonly bubbles: Locator;
  readonly userBubbles: Locator;
  readonly butchBubbles: Locator;
  readonly typingIndicator: Locator;
  readonly headerAvatar: Locator;
  readonly quickPrompts: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByRole('textbox', { name: 'Ask Butch a question' });
    this.sendButton = page.getByRole('button', { name: 'Send', exact: true });
    this.log = page.getByRole('log', { name: 'Conversation with Butch' });
    this.bubbles = this.log.getByTestId('message');
    this.userBubbles = this.log.locator('[data-testid="message"][data-role="user"]');
    this.butchBubbles = this.log.locator('[data-testid="message"][data-role="butch"]');
    this.typingIndicator = page.getByTestId('typing-indicator');
    this.headerAvatar = page.getByRole('banner').getByTestId('butch-avatar');
    this.quickPrompts = page.getByRole('list', { name: 'Suggested questions' }).getByRole('button');
  }

  /** Butch's most recent message. */
  get lastReply(): Locator {
    return this.butchBubbles.last();
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.bubbles).toHaveCount(1); // Butch's greeting
  }

  /** Types a question, presses Enter, and waits for Butch's reply. */
  async ask(question: string): Promise<void> {
    if (this.page.url() === 'about:blank') await this.open();
    const repliesBefore = await this.butchBubbles.count();
    await this.input.fill(question);
    await this.input.press('Enter');
    await expect(this.butchBubbles).toHaveCount(repliesBefore + 1);
  }

  /** Holds each reply for a moment so tests can see the "typing" state. */
  async slowDownReplies(ms = 1500): Promise<void> {
    await this.page.route('**/api/chat', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.continue();
    });
  }
}
