import { RovexoWordmark } from "@/components/brand/RovexoWordmark";
import { cn } from "@/lib/cn";

type RovexoBrandLogoProps = {
  className?: string;
};

/**
 * Canonical horizontal ROVEXO brand block for authentication screens.
 * Wordmark + BUY. SELL. GROW. — never the RX / PWA app icon.
 */
export function RovexoBrandLogo({ className }: RovexoBrandLogoProps) {
  return (
    <div className={cn("rovexo-brand-logo", className)} aria-label="ROVEXO Buy Sell Grow">
      <RovexoWordmark className="rovexo-brand-logo__wordmark" />
      <p className="rovexo-brand-logo__tagline" aria-hidden>
        <span className="rovexo-brand-logo__buy">BUY.</span>{" "}
        <span className="rovexo-brand-logo__sell">SELL.</span>{" "}
        <span className="rovexo-brand-logo__grow">GROW.</span>
      </p>
    </div>
  );
}
