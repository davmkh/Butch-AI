import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { mockServer, received } from './mockServer.ts';

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  mockServer.resetHandlers();
  received.chat.length = 0;
  received.feedback.length = 0;
  localStorage.clear();
});

afterAll(() => mockServer.close());
