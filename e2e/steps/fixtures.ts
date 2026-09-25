import { createBdd, test as base } from 'playwright-bdd';
import { ChatPage } from './chatPage.ts';

/** Things one scenario's steps share with each other. Fresh for every scenario. */
export interface ScenarioState {
  typedQuestion?: string;
  bubbleCountBefore?: number;
  askedQuestion?: string;
  feedback: { status: number; messageId: string; rating: string }[];
}

export const test = base.extend<{ chat: ChatPage; state: ScenarioState }>({
  chat: async ({ page }, use) => {
    await use(new ChatPage(page));
  },
  state: async ({}, use) => {
    await use({ feedback: [] });
  },
});

export const { Given, When, Then } = createBdd(test);
