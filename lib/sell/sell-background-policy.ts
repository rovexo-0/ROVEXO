/** Milliseconds of title idle time before background sell-page intelligence may run. */
export const SELL_TITLE_IDLE_MS = 800;

/**
 * Background sell-page features. All run only after title idle commit — never on keypress.
 */
export const sellBackgroundPolicy = {
  /** AI vision analysis after first photo upload. */
  photoAiEnabled: true,
  /** Title/photo category suggestion and auto-select. */
  categorySuggestEnabled: true,
  /** Browser geolocation → city autofill on sell form load. */
  autoLocationEnabled: true,
} as const;
