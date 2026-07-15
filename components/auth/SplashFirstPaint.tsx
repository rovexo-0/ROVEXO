/**
 * Instant first-paint splash chrome — used by route loading boundaries.
 * Never homepage skeleton / black blank / empty frame.
 */
export function SplashFirstPaint({ label = "Loading ROVEXO" }: { label?: string }) {
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
        <div className="auth-splash__stage">
          {/* eslint-disable-next-line @next/next/no-img-element -- loading boundary first paint; SafeImage not for splash SSOT */}
          <img
            className="auth-splash__mark"
            src="/icons/icon-192.png"
            width={96}
            height={96}
            alt=""
            decoding="async"
          />
          <p className="auth-splash__wordmark">
            ROVE<span className="auth-splash__wordmark-x">X</span>O
          </p>
          <p className="auth-splash__tagline">BUY . SELL . GROW.</p>
          <div className="auth-splash__indicator" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
