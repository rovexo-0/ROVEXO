/** Milliseconds of title idle time before any sell-page background work may run. */
export const SELL_TITLE_IDLE_MS = 800;

/**
 * Launch blocker controls — background intelligence is OFF until title has been idle.
 * Re-enable individual flags after title isolation is verified in production.
 */
export const sellBackgroundPolicy = {
  /** AI vision analysis after first photo upload. */
  photoAiEnabled: false,
  /** Title/photo category suggestion and auto-select. */
  categorySuggestEnabled: false,
  /** Browser geolocation → city autofill on sell form load. */
  autoLocationEnabled: false,
} as const;
