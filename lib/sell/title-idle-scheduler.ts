export const TITLE_IDLE_COMMIT_MS = 800;

type TitleIdleScheduler = {
  touch: () => void;
  cancel: () => void;
  flush: () => void;
};

/**
 * Fires `commit` only after the user has stopped changing the title for `idleMs`.
 * Never runs on the input event path.
 */
export function createTitleIdleScheduler(
  commit: (title: string) => void,
  getTitle: () => string,
  idleMs = TITLE_IDLE_COMMIT_MS,
): TitleIdleScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function runCommit() {
    timer = null;
    setTimeout(() => {
      commit(getTitle());
    }, 0);
  }

  function touch() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(runCommit, idleMs);
  }

  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function flush() {
    cancel();
    runCommit();
  }

  return { touch, cancel, flush };
}
