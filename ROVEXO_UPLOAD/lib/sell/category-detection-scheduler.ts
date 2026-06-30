export const CATEGORY_DETECTION_DEBOUNCE_MS = 800;

type DebouncedCategoryDetection = {
  schedule: () => void;
  cancel: () => void;
  runSoon: () => void;
};

/**
 * Debounces expensive category detection so it never runs on the input event path.
 * Work is deferred with setTimeout(0) after the debounce window closes.
 */
export function createDebouncedCategoryDetection(
  run: () => void,
  debounceMs = CATEGORY_DETECTION_DEBOUNCE_MS,
): DebouncedCategoryDetection {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function deferRun() {
    setTimeout(run, 0);
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      deferRun();
    }, debounceMs);
  }

  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function runSoon() {
    cancel();
    deferRun();
  }

  return { schedule, cancel, runSoon };
}
