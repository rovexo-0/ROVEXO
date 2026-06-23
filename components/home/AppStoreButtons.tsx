import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type AppStoreButtonsProps = {
  className?: string;
};

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.19-1.23 3.08-.9.98-2.37 1.74-3.77 1.64-.14-1.09.45-2.24 1.22-3.05.84-.88 2.3-1.53 3.58-1.67.01.01.14 1 .2 1ZM20.67 17.23c-.58 1.34-.86 1.94-1.61 3.13-1.05 1.62-2.53 3.64-4.37 3.65-1.03.01-1.63-.67-3.4-.66-1.77.01-2.14.68-3.17.67-1.84-.01-3.24-1.86-4.29-3.47C2.14 18.08.87 12.55 3.36 9.39c1.24-1.57 3.2-2.49 5.04-2.49 1.88 0 3.06 1.01 4.61 1.01 1.5 0 2.42-1.01 4.58-1.01 1.64.03 3.38.9 4.6 2.31-4.05 2.2-3.4 7.93.68 9.52-.57 1.5-1.18 2.45-1.8 3.51Z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.6 2.4A1.8 1.8 0 0 0 2.4 4.2v15.6c0 .96.78 1.74 1.74 1.74.42 0 .84-.15 1.16-.42l13.2-7.8c.72-.48.72-1.5 0-1.98l-13.2-7.8A1.79 1.79 0 0 0 3.6 2.4Zm1.2 2.04 10.68 6.36L4.8 17.16V4.44Z" />
    </svg>
  );
}

export function AppStoreButtons({ className }: AppStoreButtonsProps) {
  return (
    <div className={cn("hero-banner-2026__stores", className)}>
      <a
        href="https://apps.apple.com"
        target="_blank"
        rel="noopener noreferrer"
        className={cn("hero-store-badge", focusRing, transitionFast)}
        aria-label="Download on the App Store"
      >
        <AppleIcon className="hero-store-badge__icon" />
        <span className="hero-store-badge__text">
          <span className="hero-store-badge__line">Download on the</span>
          <span className="hero-store-badge__brand">App Store</span>
        </span>
      </a>
      <a
        href="https://play.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className={cn("hero-store-badge", focusRing, transitionFast)}
        aria-label="Get it on Google Play"
      >
        <PlayIcon className="hero-store-badge__icon" />
        <span className="hero-store-badge__text">
          <span className="hero-store-badge__line">Get it on</span>
          <span className="hero-store-badge__brand">Google Play</span>
        </span>
      </a>
    </div>
  );
}
