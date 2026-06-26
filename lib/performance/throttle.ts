export function throttle<T extends (...args: never[]) => void>(fn: T, waitMs: number): T {
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const invoke = (args: Parameters<T>) => {
    lastRun = Date.now();
    timeoutId = null;
    fn(...args);
  };

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = waitMs - (now - lastRun);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      invoke(args);
      return;
    }

    if (timeoutId === null) {
      timeoutId = setTimeout(() => invoke(args), remaining);
    }
  }) as T;
}
