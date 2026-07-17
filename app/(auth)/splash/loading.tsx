/** Instant auth paint — brand only, never homepage skeleton. */
export default function SplashLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#ffffff",
        display: "grid",
        placeItems: "center",
      }}
      aria-busy="true"
    />
  );
}
