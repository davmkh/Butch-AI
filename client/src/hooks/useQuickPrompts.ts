import { useCallback, useEffect, useMemo, useState } from 'react';
import type { QuickPrompt } from '@butch/shared';
import type { ButchApi } from '../api/butchApi.ts';

const STORAGE_KEY = 'butch.recentQuestions';
const MAX_STORED = 5;
const MAX_PERSONAL_PROMPTS = 2;

export interface QuickPromptItem extends QuickPrompt {
  /** True when this came from the user's own history rather than the site-wide FAQ. */
  recent: boolean;
}

/**
 * FAQ buttons (US-05): up to two of this user's own recent questions, then the
 * site-wide most-asked list. Recent questions are kept only in this browser's
 * localStorage, never on the server.
 */
export function useQuickPrompts(api: ButchApi) {
  const [sitePrompts, setSitePrompts] = useState<QuickPrompt[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<string[]>(readRecent);

  useEffect(() => {
    let cancelled = false;
    api
      .quickPrompts()
      .then((prompts) => !cancelled && setSitePrompts(prompts))
      .catch(() => {
        // Quick prompts are a convenience; the chat still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const remember = useCallback((question: string) => {
    const text = question.trim();
    if (!text) return;
    setRecentQuestions((prev) => {
      const next = [text, ...prev.filter((q) => q.toLowerCase() !== text.toLowerCase())].slice(
        0,
        MAX_STORED,
      );
      writeRecent(next);
      return next;
    });
  }, []);

  const prompts = useMemo<QuickPromptItem[]>(() => {
    const personal = recentQuestions.slice(0, MAX_PERSONAL_PROMPTS).map((prompt, i) => ({
      id: `recent-${i}`,
      prompt,
      recent: true,
    }));
    const taken = new Set(personal.map((p) => p.prompt.toLowerCase()));
    const site = sitePrompts
      .filter((p) => !taken.has(p.prompt.toLowerCase()))
      .map((p) => ({ ...p, recent: false }));
    return [...personal, ...site];
  }, [recentQuestions, sitePrompts]);

  return { prompts, remember };
}

// localStorage can be missing or throw (private browsing, blocked storage), so never let it break the page.
function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === 'string') : [];
  } catch {
    return [];
  }
}

function writeRecent(questions: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  } catch {
    // Ignore: personalization is optional.
  }
}
