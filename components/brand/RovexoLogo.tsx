import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type RovexoLogoProps = {
  className?: string;
  variant?: "full" | "compact" | "mark" | "responsive";
};

type RovexoLogoBrandProps = {
  className?: string;
  /** Embedded inside the integrated header search control */
  integrated?: boolean;
};

function LogoGlyph({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[7px] bg-[image:var(--ds-gradient-primary)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[52%] w-[52%] text-primary-foreground" aria-hidden>
        <path
          fill="currentColor"
          d="M6 18V6h5.2c2.52 0 4.08 1.34 4.08 3.36 0 1.46-.74 2.46-2.02 2.94l2.74 5.7h-2.46l-2.38-5.02H8.4V18H6Zm2.4-6.86h2.58c1.24 0 1.92-.58 1.92-1.58 0-1-.68-1.58-1.92-1.58H8.4v3.16Z"
        />
      </svg>
    </span>
  );
}

/** Header mark — blue R logo 40×40 @ 12px radius */
export function RovexoHeaderMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ROVEXO Home"
      className={cn(
        "inline-flex h-[44px] w-[44px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center",
        focusRing,
        transitionFast,
        "hover:opacity-90 active:scale-[0.98]",
        className,
      )}
    >
      <LogoGlyph className="h-10 w-10 rounded-[12px]" />
    </Link>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-extrabold tracking-tight text-text-primary", className)}>
      ROV<span className="text-primary">EXO</span>
    </span>
  );
}

/** Inline brand mark for embedding inside the integrated header search */
export function RovexoLogoBrand({ className, integrated = false }: RovexoLogoBrandProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        integrated ? "gap-1.5 lg:gap-2" : "gap-1.5 sm:gap-2",
        className,
      )}
      aria-hidden
    >
      <LogoGlyph
        className={cn(
          integrated
            ? "aspect-square h-6 w-6 rounded-[6px] lg:h-7 lg:w-7 lg:rounded-[7px]"
            : "aspect-square h-[1.625rem] rounded-[7px]",
        )}
      />
      <Wordmark
        className={cn(
          integrated
            ? "hidden min-[480px]:inline text-[0.8125rem] leading-none sm:text-sm lg:text-[0.95rem]"
            : "text-[0.8125rem] leading-none sm:text-sm",
        )}
      />
    </span>
  );
}

function RovexoLogoMark({
  variant = "full",
  responsive = false,
}: {
  variant?: RovexoLogoProps["variant"];
  responsive?: boolean;
}) {
  const isMark = variant === "mark" && !responsive;
  const isCompact = variant === "compact" || variant === "mark" || responsive;
  const wordmarkVisible = !isMark;

  return (
    <span
      className={cn(
        "inline-flex h-full items-center",
        isCompact ? "gap-1.5" : "gap-2 sm:gap-2.5",
        wordmarkVisible && !isCompact && "min-w-[7.25rem] sm:min-w-[7.5rem]",
      )}
      aria-hidden
    >
      <LogoGlyph
        className={cn(
          isCompact ? "aspect-square h-[1.5rem] rounded-[6px]" : "aspect-square h-[92%]",
        )}
      />
      {wordmarkVisible && (
        <Wordmark
          className={cn(
            responsive && "hidden sm:inline",
            isCompact ? "text-[0.8125rem] leading-none" : "text-[0.95rem] sm:text-base lg:text-[1.05rem]",
          )}
        />
      )}
    </span>
  );
}

export function RovexoLogo({ className, variant = "full" }: RovexoLogoProps) {
  const isCompact = variant === "compact" || variant === "mark" || variant === "responsive";
  const isResponsive = variant === "responsive";

  return (
    <Link
      href="/"
      aria-label="ROVEXO Home"
      className={cn(
        "inline-flex shrink-0 items-center",
        isCompact ? "h-7" : "h-[28px] sm:h-[30px] lg:h-[32px]",
        focusRing,
        transitionFast,
        "hover:opacity-90 active:scale-[0.98]",
        className,
      )}
    >
      <RovexoLogoMark
        variant={variant === "responsive" ? "mark" : variant}
        responsive={isResponsive}
      />
    </Link>
  );
}

export const ROVEXO_LOGO_DIMENSIONS = {
  mobileHeight: 28,
  compactHeight: 32,
  desktopHeight: 32,
  integratedControlHeight: 40,
  width: 124,
} as const;
