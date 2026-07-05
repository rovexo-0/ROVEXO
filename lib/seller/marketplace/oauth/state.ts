import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { OAuthStatePayload } from "@/lib/seller/marketplace/oauth/types";

const STATE_COOKIE = "rovexo_oauth_state";

function encodePayload(payload: OAuthStatePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): OAuthStatePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!parsed.sellerId || !parsed.platform || !parsed.returnTo || !parsed.nonce) return null;
    return parsed;
  } catch {
    return null;
  }
}

function oauthCookieFlags(maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function createOAuthState(payload: OAuthStatePayload): { value: string; cookie: string } {
  const value = encodePayload(payload);
  return {
    value,
    cookie: `${STATE_COOKIE}=${value}; ${oauthCookieFlags(600)}`,
  };
}

export function readOAuthState(cookieHeader: string | null, value: string | null): OAuthStatePayload | null {
  if (!value) return null;
  const cookieValue = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);
  if (!cookieValue || cookieValue !== value) return null;
  return decodePayload(value);
}

export function clearOAuthStateCookie(): string {
  return `${STATE_COOKIE}=; ${oauthCookieFlags(0)}`;
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function createOAuthNonce(): string {
  return randomBytes(16).toString("hex");
}
