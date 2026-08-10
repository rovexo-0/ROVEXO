"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";

/**
 * Listing segment error — presents fail-closed copy in context.
 * Retry remounts the segment; Home dismisses without a forced remount loop.
 */
export default function ListingError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div style={{ padding: 16 }} data-listing-error-ux="contextual">
      <FailClosedPanel density="section" error={error} onRetry={() => reset()} />
    </div>
  );
}
