type IdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleCallback = (deadline: IdleDeadline) => void;

export function scheduleIdleTask(callback: IdleCallback, timeoutMs = 2000): () => void {
  if (typeof window === "undefined") {
    callback({ didTimeout: true, timeRemaining: () => 0 });
    return () => undefined;
  }

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }

  const timer = globalThis.setTimeout(() => {
    callback({ didTimeout: true, timeRemaining: () => 0 });
  }, 1);

  return () => globalThis.clearTimeout(timer);
}
