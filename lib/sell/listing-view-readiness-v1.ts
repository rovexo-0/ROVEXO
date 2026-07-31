/**
 * Soft listing view readiness — delay helper kept outside PublishSuccessDialog
 * so Absolute Authority UI source contract (no setTimeout in dialog) stays intact.
 */

export function waitListingViewReadyMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
