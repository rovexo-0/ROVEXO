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
export { fetchDeduped, abortInflightFetches, createScopedFetcher, shareInflightJson, invalidateShareInflight } from "@/lib/performance/fetch";
export { PHASE_A1_NAVIGATION_V1 } from "@/lib/performance/phase-a1-navigation-v1";
