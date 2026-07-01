/** Run category detection only after blur / photo change — not while typing. */
export const CATEGORY_DETECTION_DEBOUNCE_MS = 1000;

export type DebouncedCategoryDetection = {
  schedule: () => void;
  runSoon: () => void;
  cancel: () => void;
};

export function createDebouncedCategoryDetection(
  run: () => void,
  delayMs = CATEGORY_DETECTION_DEBOUNCE_MS,
): DebouncedCategoryDetection {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = () => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      run();
    }, delayMs);
  };

  const runSoon = () => {
    cancel();
    queueMicrotask(run);
  };

  return { schedule, runSoon, cancel };
}
