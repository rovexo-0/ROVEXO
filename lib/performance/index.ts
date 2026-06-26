export { isDocumentVisible, subscribeDocumentVisibility, runWhenVisible } from "@/lib/performance/visibility";
export {
  useDocumentVisible,
  useVisibilityPolling,
  useVisibilityInterval,
  useRafLoopWhenVisible,
  usePauseableEffect,
  useStableCallback,
  useVisibilityState,
  useIntersectionWhenVisible,
} from "@/lib/performance/hooks";
export { throttle } from "@/lib/performance/throttle";
export { scheduleIdleTask } from "@/lib/performance/idle";
export { fetchDeduped, abortInflightFetches, createScopedFetcher } from "@/lib/performance/fetch";
