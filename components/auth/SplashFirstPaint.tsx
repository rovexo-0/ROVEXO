/**
 * Instant first-paint splash chrome — used by route loading boundaries.
 * Never homepage skeleton / black blank / empty frame.
 */
export function SplashFirstPaint({
  label = "Loading ROVEXO",
  wordmarkOnly = false,
}: {
  label?: string;
  wordmarkOnly?: boolean;
}) {
  return (
    <div
      className="auth-splash-route"
      data-splash-first-paint="true"
      style={{
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: "#ffffff",
        colorScheme: "light",
      }}
    >
      <div className="auth-splash auth-splash--ssr" role="status" aria-label={label}>
        <div
          className={
            wordmarkOnly
              ? "auth-splash__stage auth-splash__stage--wordmark-only"
              : "auth-splash__stage"
          }
        >
          {!wordmarkOnly ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- auth loading boundary first paint */}
              <img
                className="auth-splash__mark"
                src="/icons/icon-192.png"
                width={96}
                height={96}
                alt=""
                decoding="async"
              />
            </>
          ) : null}
          <p className="auth-splash__wordmark">
            ROVE<span className="auth-splash__wordmark-x">X</span>O
          </p>
          <p className="auth-splash__tagline">BUY . SELL . GROW.</p>
          {wordmarkOnly ? (
            <span className="auth-splash__pulse" aria-hidden />
          ) : (
            <div className="auth-splash__indicator" aria-hidden>
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
