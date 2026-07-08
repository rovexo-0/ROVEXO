import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type RovexoHomepageWordmarkProps = {
  className?: string;
};

/** Official ROVEXO wordmark — accent X, crisp SVG, vertically centred in header. */
export function RovexoHomepageWordmark({ className }: RovexoHomepageWordmarkProps) {
  return (
    <Link
      href="/"
      aria-label="ROVEXO Home"
      className={cn(
        "homepage-header__logo inline-flex shrink-0 items-center",
        focusRing,
        transitionFast,
        "hover:opacity-90 active:scale-[0.98]",
        className,
      )}
    >
      <svg
        className="homepage-header__wordmark"
        viewBox="0 0 108 20"
        width="108"
        height="20"
        role="img"
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0"
          y="16"
          fill="currentColor"
          fontFamily="var(--ds-font-family, system-ui, -apple-system, sans-serif)"
          fontSize="17"
          fontWeight="800"
          letterSpacing="-0.04em"
        >
          ROV
        </text>
        <text
          x="44"
          y="16"
          fill="var(--ds-color-primary)"
          fontFamily="var(--ds-font-family, system-ui, -apple-system, sans-serif)"
          fontSize="17"
          fontWeight="800"
          letterSpacing="-0.04em"
        >
          X
        </text>
        <text
          x="56"
          y="16"
          fill="currentColor"
          fontFamily="var(--ds-font-family, system-ui, -apple-system, sans-serif)"
          fontSize="17"
          fontWeight="800"
          letterSpacing="-0.04em"
        >
          O
        </text>
      </svg>
    </Link>
  );
}
