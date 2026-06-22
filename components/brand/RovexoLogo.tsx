import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type RovexoLogoProps = {
  className?: string;
};

function RovexoLogoMark() {
  return (
    <span
      className="inline-flex h-full min-w-[7.25rem] items-center gap-2 sm:min-w-[7.5rem] sm:gap-2.5"
      aria-hidden
    >
      <span className="flex aspect-square h-[92%] shrink-0 items-center justify-center rounded-[9px] bg-[image:var(--ds-gradient-primary)] shadow-ds-soft">
        <svg
          viewBox="0 0 24 24"
          className="h-[52%] w-[52%] text-primary-foreground"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M6 18V6h5.2c2.52 0 4.08 1.34 4.08 3.36 0 1.46-.74 2.46-2.02 2.94l2.74 5.7h-2.46l-2.38-5.02H8.4V18H6Zm2.4-6.86h2.58c1.24 0 1.92-.58 1.92-1.58 0-1-.68-1.58-1.92-1.58H8.4v3.16Z"
          />
        </svg>
      </span>
      <span className="text-[0.95rem] font-extrabold tracking-tight text-text-primary sm:text-base lg:text-[1.05rem]">
        ROV<span className="text-primary">EXO</span>
      </span>
    </span>
  );
}

export function RovexoLogo({ className }: RovexoLogoProps) {
  return (
    <Link
      href="/"
      aria-label="ROVEXO Home"
      className={cn(
        "inline-flex h-[28px] shrink-0 items-center sm:h-[30px] lg:h-[32px]",
        focusRing,
        transitionFast,
        className,
      )}
    >
      <RovexoLogoMark />
    </Link>
  );
}

export const ROVEXO_LOGO_DIMENSIONS = {
  mobileHeight: 28,
  desktopHeight: 32,
  width: 124,
} as const;
