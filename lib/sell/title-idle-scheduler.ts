/** Commit title to parent draft after the user stops typing. */
export const TITLE_IDLE_COMMIT_MS = 800;

export type TitleIdleScheduler = {
  touch: () => void;
  flush: () => void;
  cancel: () => void;
};

export function createTitleIdleScheduler(
  onCommit: (title: string) => void,
  readTitle: () => string,
  delayMs = TITLE_IDLE_COMMIT_MS,
): TitleIdleScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const flush = () => {
    cancel();
    onCommit(readTitle());
  };

  const touch = () => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      onCommit(readTitle());
    }, delayMs);
  };

  return { touch, flush, cancel };
}
