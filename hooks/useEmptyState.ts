/**
 * Visibility gate for Teddy Empty State (v1.1 static).
 * No timers, no rAF, no fade, no motion, no side effects.
 */
export function useEmptyState(visible: boolean) {
  return { mounted: visible };
}
