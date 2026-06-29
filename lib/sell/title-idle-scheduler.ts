export const TITLE_IDLE_COMMIT_MS = 800;

type TitleIdleScheduler = {
  touch: () => void;
  cancel: () => void;
  /** Commits the current title immediately (publish / save). */
  flush: () => void;
};

/**
 * Fires `commit` only after the user has stopped changing the title for `idleMs`.
 * `flush()` commits synchronously so publish/save never races validation.
 */
export function createTitleIdleScheduler(
  commit: (title: string) => void,
  getTitle: () => string,
  idleMs = TITLE_IDLE_COMMIT_MS,
): TitleIdleScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function commitNow() {
    commit(getTitle());
  }

  function touch() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      commitNow();
    }, idleMs);
  }

  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function flush() {
    cancel();
    commitNow();
  }

  return { touch, cancel, flush };
}
