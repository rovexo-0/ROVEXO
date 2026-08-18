/**
 * Homepage marketplace feed — eligible-item pagination (batch size only).
 *
 * `HOMEPAGE_FEED_PAGE_SIZE` (12) is the initial/next batch size, never a
 * catalogue cap. Pagination walks the ordered stream of ELIGIBLE listings.
 * Ineligible / Holiday-hidden rows do not consume batch capacity.
 *
 * `hasMore` means: at least one additional eligible listing exists after this
 * returned batch. It does not mean "the current DB scan window was short".
 */

export const HOMEPAGE_FEED_SCAN_WINDOW_MULTIPLIER = 3;

export type HomepageFeedScanWindow<T> = {
  /** Visibility-filtered rows in catalogue order (Holiday Mode already applied). */
  rows: T[];
  /** Raw catalogue rows fetched in this window (before visibility filter). */
  fetchedCount: number;
};

export type HomepageFeedEligiblePage<T> = {
  items: T[];
  hasMore: boolean;
};

function resolvePage(page: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.trunc(page);
}

/**
 * Collect one homepage feed batch from an ordered candidate stream.
 * Always scans from the start of the catalogue order, skips
 * `(page - 1) * pageSize` eligible IDs, then takes up to `pageSize` eligible IDs.
 */
export async function collectEligibleHomepageFeedPage<T>(input: {
  page: number;
  pageSize: number;
  fetchScanWindow: (fromInclusive: number, toInclusive: number) => Promise<HomepageFeedScanWindow<T>>;
  isEligible: (row: T) => boolean;
  getId: (row: T) => string;
  scanWindowSize?: number;
}): Promise<HomepageFeedEligiblePage<T>> {
  const page = resolvePage(input.page);
  const pageSize = input.pageSize;
  const windowSize = Math.max(1, input.scanWindowSize ?? pageSize * HOMEPAGE_FEED_SCAN_WINDOW_MULTIPLIER);
  let skipRemaining = (page - 1) * pageSize;
  const items: T[] = [];
  const seenEligibleIds = new Set<string>();
  let scanFrom = 0;

  while (true) {
    const scanTo = scanFrom + windowSize - 1;
    const window = await input.fetchScanWindow(scanFrom, scanTo);
    const fetchedCount = window.fetchedCount;
    if (fetchedCount <= 0) {
      break;
    }

    for (const row of window.rows) {
      const id = input.getId(row);
      if (!id || seenEligibleIds.has(id)) continue;
      if (!input.isEligible(row)) continue;
      seenEligibleIds.add(id);

      if (skipRemaining > 0) {
        skipRemaining -= 1;
        continue;
      }
      if (items.length < pageSize) {
        items.push(row);
        continue;
      }
      return { items, hasMore: true };
    }

    if (fetchedCount < windowSize) {
      break;
    }
    scanFrom += windowSize;
  }

  return { items, hasMore: false };
}
