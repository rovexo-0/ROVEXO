/**
 * ROVEXO v1.0 — Viewer identity for View System (Master Architect).
 * DATABASE dedup key only. No localStorage. No sessionStorage authority.
 */

import { createHash } from "node:crypto";
import { headers } from "next/headers";

const BOT_UA =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|preview|wget|curl|python-requests|scrapy|headless|phantom|selenium/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim().length < 8) return true;
  return BOT_UA.test(userAgent);
}

export async function resolveViewerKey(userId?: string | null): Promise<{
  viewerKey: string;
  isBot: boolean;
}> {
  if (userId) {
    return { viewerKey: `user:${userId}`, isBot: false };
  }

  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent");
  if (isBotUserAgent(userAgent)) {
    return { viewerKey: "bot:blocked", isBot: true };
  }

  const forwarded = hdrs.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip")?.trim() ||
    "0.0.0.0";
  const hash = createHash("sha256")
    .update(`${ip}|${userAgent ?? "unknown"}`)
    .digest("hex")
    .slice(0, 32);

  return { viewerKey: `anon:${hash}`, isBot: false };
}
