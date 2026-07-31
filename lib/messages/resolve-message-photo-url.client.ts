"use client";

import { tryCreateClient } from "@/lib/supabase/client";
import {
  isMessagePhotoStoragePath,
  isRenderableMessagePhotoSrc,
  MESSAGE_PHOTO_SIGN_TTL_SECONDS,
} from "@/lib/messages/message-photo-url-v1";

const signCache = new Map<string, { url: string; expiresAt: number }>();
const inflight = new Map<string, Promise<string | null>>();

/**
 * Resolve a messages-bucket storage path to a signed URL (client).
 * Caches + coalesces concurrent signs for the same path.
 */
export async function resolveMessagePhotoUrl(content: string): Promise<string | null> {
  const trimmed = content.trim();
  if (!trimmed) return null;
  if (isRenderableMessagePhotoSrc(trimmed)) return trimmed;
  if (!isMessagePhotoStoragePath(trimmed)) return null;

  const cached = signCache.get(trimmed);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.url;
  }

  const existing = inflight.get(trimmed);
  if (existing) return existing;

  const task = (async (): Promise<string | null> => {
    const supabase = tryCreateClient();
    if (!supabase) return null;
    const { data, error } = await supabase.storage
      .from("messages")
      .createSignedUrl(trimmed, MESSAGE_PHOTO_SIGN_TTL_SECONDS);
    if (error || !data?.signedUrl) return null;
    signCache.set(trimmed, {
      url: data.signedUrl,
      expiresAt: Date.now() + MESSAGE_PHOTO_SIGN_TTL_SECONDS * 1000,
    });
    return data.signedUrl;
  })().finally(() => {
    inflight.delete(trimmed);
  });

  inflight.set(trimmed, task);
  return task;
}

export function clearMessagePhotoUrlCache(prefix?: string): void {
  if (!prefix) {
    signCache.clear();
    return;
  }
  for (const key of [...signCache.keys()]) {
    if (key.startsWith(prefix)) signCache.delete(key);
  }
}
