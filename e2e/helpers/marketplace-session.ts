/**
 * Shared E2E marketplace session — Auth Master: guest `/` → Login.
 * Homepage / marketplace UI assertions require an authenticated demo session.
 */
import type { Page } from "@playwright/test";
import { FULL_DEMO_ACCOUNTS } from "../../lib/full-demo/canonical";
import { signInWithSessionCookies } from "./auth";

const BUYER = FULL_DEMO_ACCOUNTS[0]!;
const COOKIE_CONSENT_KEY = "rovexo_cookie_consent_v1";

export async function dismissCookieBanner(page: Page): Promise<void> {
  const accept = page.getByRole("button", { name: /^Accept$/i });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!(await accept.isVisible().catch(() => false))) break;
    await accept.click({ force: true });
    await page.waitForTimeout(150);
  }
}

export async function ensureMarketplaceSession(
  page: Page,
  baseURL: string | undefined,
): Promise<void> {
  if (!baseURL) {
    throw new Error("ensureMarketplaceSession requires baseURL");
  }
  await page.addInitScript((key) => {
    try {
      window.localStorage.setItem(key, "accepted");
    } catch {
      /* ignore */
    }
  }, COOKIE_CONSENT_KEY);
  await signInWithSessionCookies(page, {
    email: BUYER.email,
    password: BUYER.password ?? "",
    baseURL,
  });
}
