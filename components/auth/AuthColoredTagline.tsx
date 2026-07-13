import { cn } from "@/lib/cn";

type AuthColoredTaglineProps = {
  className?: string;
};

/** Official coloured BUY. SELL. GROW. branding for auth screens. */
export function AuthColoredTagline({ className }: AuthColoredTaglineProps) {
  return (
    <p className={cn("auth-colored-tagline", className)} aria-label="Buy. Sell. Grow.">
      <span className="auth-colored-tagline__buy">BUY.</span>{" "}
      <span className="auth-colored-tagline__sell">SELL.</span>{" "}
      <span className="auth-colored-tagline__grow">GROW.</span>
    </p>
  );
}
