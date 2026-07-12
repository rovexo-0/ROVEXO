/** Light commerce haptic — iOS/Android web (FINAL PATCH §7). */
export function triggerCommerceHaptic(): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    navigator.vibrate(10);
  } catch {
    // Best-effort only.
  }
}
