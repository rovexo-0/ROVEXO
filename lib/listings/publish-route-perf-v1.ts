/**
 * Temporary Publish POST timing marks (P0 storage + ISR).
 * Absolute timestamps so concurrent publishes do not share a clock.
 * Do not log tokens, paths that are not needed, or storage secrets.
 */
export function publishPerfLog(event: string): void {
  console.info(`[PUBLISH_PERF] ${event} t=${Date.now()}`);
}
