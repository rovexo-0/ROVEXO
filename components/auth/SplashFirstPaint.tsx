/**
 * Auth boot loading chrome — plain white first paint.
 * Splash Screen UI is removed. Never homepage skeleton.
 */
export function SplashFirstPaint({
  label = "Loading ROVEXO",
}: {
  label?: string;
  /** @deprecated Splash branding removed — ignored. */
  wordmarkOnly?: boolean;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: "#ffffff",
        display: "grid",
        placeItems: "center",
        colorScheme: "light",
      }}
      role="status"
      aria-label={label}
      aria-busy="true"
    />
  );
}
