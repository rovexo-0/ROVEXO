"use client";

import type { HelpAnalyticsEvent, HelpSessionPathStep, HelpSessionState, HelpTopicSlug } from "@/lib/help/types";

const SESSION_KEY = "rovexo-help-session";

export const EMPTY_HELP_SESSION: HelpSessionState = {
  topicSlug: null,
  path: [],
  articlesViewed: [],
  solutionsViewed: [],
  treeCompleted: false,
  resolutionAttempted: false,
  resolved: null,
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function readHelpSession(): HelpSessionState {
  if (typeof window === "undefined") return EMPTY_HELP_SESSION;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return EMPTY_HELP_SESSION;
    return { ...EMPTY_HELP_SESSION, ...JSON.parse(raw) } as HelpSessionState;
  } catch {
    return EMPTY_HELP_SESSION;
  }
}

export function writeHelpSession(session: HelpSessionState): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() }),
  );
}

export function startHelpSession(topicSlug: HelpTopicSlug): HelpSessionState {
  const session: HelpSessionState = {
    ...EMPTY_HELP_SESSION,
    topicSlug,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeHelpSession(session);
  return session;
}

export function appendHelpSessionStep(
  session: HelpSessionState,
  step: Omit<HelpSessionPathStep, "timestamp">,
): HelpSessionState {
  const next: HelpSessionState = {
    ...session,
    path: [...session.path, { ...step, timestamp: new Date().toISOString() }],
    updatedAt: new Date().toISOString(),
  };
  writeHelpSession(next);
  return next;
}

export function markArticleViewed(session: HelpSessionState, slug: string): HelpSessionState {
  if (session.articlesViewed.includes(slug)) return session;
  const next = {
    ...session,
    articlesViewed: [...session.articlesViewed, slug],
    updatedAt: new Date().toISOString(),
  };
  writeHelpSession(next);
  return next;
}

export function markSolutionViewed(session: HelpSessionState, solutionId: string): HelpSessionState {
  const next = {
    ...session,
    solutionsViewed: [...new Set([...session.solutionsViewed, solutionId])],
    treeCompleted: true,
    updatedAt: new Date().toISOString(),
  };
  writeHelpSession(next);
  return next;
}

export function markResolution(session: HelpSessionState, resolved: boolean): HelpSessionState {
  const next = {
    ...session,
    resolutionAttempted: true,
    resolved,
    updatedAt: new Date().toISOString(),
  };
  writeHelpSession(next);
  return next;
}

export function canAccessSupport(session: HelpSessionState): boolean {
  return session.treeCompleted && session.resolutionAttempted && session.resolved === false;
}

export function resetHelpSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

export async function trackHelpEvent(event: HelpAnalyticsEvent): Promise<void> {
  try {
    await fetch("/api/help/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    // Analytics must never block help UX.
  }
}

export function buildSupportContext(session: HelpSessionState, currentPage: string) {
  return {
    helpTopicSlug: session.topicSlug ?? undefined,
    decisionTreePath: session.path,
    articlesViewed: session.articlesViewed,
    solutionsViewed: session.solutionsViewed,
    treeCompleted: session.treeCompleted,
    resolutionAttempted: session.resolutionAttempted,
    currentPage,
    device: typeof navigator !== "undefined" ? navigator.platform : undefined,
    browser: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    platformVersion: "ROVEXO Web",
    country: "UK",
  };
}
