const VISIT_DEPTH_KEY = "rovexo:visit-depth";

/** Increments per in-app page mount so back can skip empty-tab history. */
export function bumpSessionVisitDepth(): number {
  if (typeof window === "undefined") return 1;
  const next = Number(sessionStorage.getItem(VISIT_DEPTH_KEY) ?? "0") + 1;
  sessionStorage.setItem(VISIT_DEPTH_KEY, String(next));
  return next;
}

export function readSessionVisitDepth(): number {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(VISIT_DEPTH_KEY) ?? "0");
}
