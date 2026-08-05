/**
 * P3.1 — ChunkLoad recovery guard (pure helpers).
 * Zero functional app change — runtime stability only.
 *
 * Bootstrap inline script MUST mirror these rules (see chunk-load-bootstrap.ts).
 */

export const CHUNK_RECOVER_PARAM = "rx_chunk" as const;
export const CHUNK_RECOVER_SESSION_KEY = "rovexo_chunk_load_recovery_v1" as const;
/** Prevents recovery storms after one heal (was effectively unlocked at 8s). */
export const CHUNK_RECOVER_COOLDOWN_MS = 120_000 as const;
export const CHUNK_RECOVERY_LOCK_PROP = "__rovexoChunkRecoveryLock" as const;

export function stringifyChunkFailure(reason: unknown): string {
  if (!reason) return "";
  if (typeof reason === "string") return reason;
  if (reason instanceof Error) {
    return `${reason.name} ${reason.message}`;
  }
  if (typeof reason === "object" && reason !== null) {
    const r = reason as { name?: unknown; message?: unknown; stack?: unknown };
    return `${String(r.name ?? "")} ${String(r.message ?? "")} ${String(r.stack ?? "")}`;
  }
  return String(reason);
}

export function isChunkLoadFailure(reason: unknown): boolean {
  const text = stringifyChunkFailure(reason);
  if (!text) return false;
  return /ChunkLoadError|Loading chunk [\d]+ failed|Failed to load chunk/i.test(text);
}

/**
 * Turbopack HMR / browser-dev async loaders — expected to desync in long-lived
 * localhost tabs after rebuild. Full-page recovery cannot eliminate framework
 * HMR races and amplifies ?rx_chunk=1 storms (R1.2 evidence).
 */
export function isTurbopackHmrChunkFailure(reason: unknown): boolean {
  const text = stringifyChunkFailure(reason);
  return /hmr-client|\[turbopack\]_browser_dev|turbopack.*hmr|\/_next\/static\/chunks\/%5Bturbopack%5D_browser_dev/i.test(
    text,
  );
}

/** Localhost + private LAN (Owner iPhone → WSL) — same set as public/sw.js. */
export function isDevRuntimeHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local") ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

/**
 * Auto-reload only for recoverable stale APP chunks.
 * Skip (do not hide — browser still logs) Turbopack HMR client races on dev hosts.
 */
export function shouldAutoRecoverChunkFailure(
  reason: unknown,
  hostname: string,
): boolean {
  if (!isChunkLoadFailure(reason)) return false;
  if (isDevRuntimeHost(hostname) && isTurbopackHmrChunkFailure(reason)) {
    return false;
  }
  return true;
}

export function isWithinRecoveryCooldown(
  stored: string | null,
  nowMs: number,
  cooldownMs: number = CHUNK_RECOVER_COOLDOWN_MS,
): boolean {
  if (!stored) return false;
  if (stored === "1") return true; // legacy flag from prior builds
  const ts = Number(stored);
  if (!Number.isFinite(ts)) return true;
  return nowMs - ts < cooldownMs;
}
