"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { EnrichedPickerOption } from "@/features/sell/ui/sell-picker-presentation-v1";

type Props = {
  option: EnrichedPickerOption;
  kind: "brand" | "material" | "condition" | "colour" | "compatibility" | "generic";
};

function BrandMark({ logoUrl, monogram }: { logoUrl: string | null; monogram: string }) {
  const [failed, setFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !failed;
  return (
    <span className="sell-picker-mark sell-picker-mark--brand" aria-hidden>
      {showLogo ? (
        // External favicon mark — plain img (not next/image) so hosts outside
        // remotePatterns never crash the Sell picker. Monogram is the fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl!}
          alt=""
          width={28}
          height={28}
          className="sell-picker-mark__logo"
          onError={() => setFailed(true)}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <span className={cn("sell-picker-mark__mono", showLogo && "sell-picker-mark__mono--behind")}>
        {monogram}
      </span>
    </span>
  );
}

function MaterialGlyph({ glyph }: { glyph: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "sell-picker-mark__glyph",
  };
  switch (glyph) {
    case "cotton":
      return (
        <svg {...common}>
          <path d="M12 3c2.5 2 3.5 4.5 3.5 7S14 16 12 21c-2-5-3.5-8-3.5-11S9.5 5 12 3Z" />
          <path d="M9 10c1 .8 2 1.2 3 1.2S14 10.8 15 10" />
        </svg>
      );
    case "wool":
      return (
        <svg {...common}>
          <path d="M6 14c0-3 2.5-5 6-5s6 2 6 5-2 5-6 5-6-2-6-5Z" />
          <path d="M8 11c.8-2 2.2-3 4-3s3.2 1 4 3" />
        </svg>
      );
    case "silk":
      return (
        <svg {...common}>
          <path d="M4 16c4-6 12-6 16 0" />
          <path d="M6 12c3.5-4 8.5-4 12 0" />
          <path d="M8 8c2.5-2.5 5.5-2.5 8 0" />
        </svg>
      );
    case "leather":
      return (
        <svg {...common}>
          <path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
          <path d="M9 8V6.8A3 3 0 0 1 15 6.8V8" />
        </svg>
      );
    case "denim":
      return (
        <svg {...common}>
          <path d="M8 4h8l1 16H7L8 4Z" />
          <path d="M10 10h4M10 14h4" />
        </svg>
      );
    case "linen":
      return (
        <svg {...common}>
          <path d="M6 5h12v14H6z" />
          <path d="M6 10h12M6 14h12" />
        </svg>
      );
    case "metal":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "wood":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M5 10h14M5 15h14" />
        </svg>
      );
    case "glass":
      return (
        <svg {...common}>
          <path d="M8 3h8l-1 18H9L8 3Z" />
          <path d="M9.5 9h5" />
        </svg>
      );
    case "foam":
      return (
        <svg {...common}>
          <rect x="4" y="8" width="16" height="10" rx="3" />
          <path d="M8 8V6.5A2.5 2.5 0 0 1 13 6.5V8" />
        </svg>
      );
    case "synthetic":
      return (
        <svg {...common}>
          <path d="M7 5h10v14H7z" />
          <path d="M10 8v8M14 8v8" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M5 7h14v10H5z" />
          <path d="M5 11h14" />
        </svg>
      );
  }
}

function ConditionGlyph({ tone }: { tone: string }) {
  return (
    <span className="sell-picker-mark sell-picker-mark--condition" style={{ background: `${tone}22`, color: tone }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden className="sell-picker-mark__glyph">
        <path d="M12 3 5 6v5c0 5 3.2 8.5 7 10 3.8-1.5 7-5 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9.5 12 1.8 1.8 3.4-3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * Leading mark for Sell picker rows — brand favicon/monogram, material glyph,
 * condition tone, or colour swatch. Presentation only.
 */
export function SellPickerLeadingMark({ option, kind }: Props) {
  if (kind === "colour" && option.swatch) {
    return (
      <span
        className="sell-picker-mark sell-picker-mark--swatch"
        style={{ backgroundColor: option.swatch }}
        aria-hidden
      />
    );
  }

  if (kind === "condition") {
    return <ConditionGlyph tone={option.tone ?? "#9333EA"} />;
  }

  if (kind === "material") {
    return (
      <span className="sell-picker-mark sell-picker-mark--material" aria-hidden>
        <MaterialGlyph glyph={option.materialKey ?? "fabric"} />
      </span>
    );
  }

  if (kind === "brand") {
    const logo = option.logoUrl ?? null;
    return <BrandMark logoUrl={logo} monogram={option.monogram ?? "—"} />;
  }

  if (kind === "compatibility") {
    return (
      <span className="sell-picker-mark sell-picker-mark--material" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="sell-picker-mark__glyph">
          <circle cx="8" cy="12" r="3" />
          <circle cx="16" cy="12" r="3" />
          <path d="M11 12h2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span className="sell-picker-mark sell-picker-mark--material" aria-hidden>
      <MaterialGlyph glyph="fabric" />
    </span>
  );
}

export function SellPickerSectionLabel({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "popular" | "all" | "default";
}) {
  return (
    <p className={cn("sell-option-picker__section-title", `sell-option-picker__section-title--${variant}`)}>
      {variant === "popular" ? (
        <span className="sell-option-picker__section-ico" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 2s3 3.2 3 6.2c0 1.7-.7 3-1.8 3.8 2.2.3 4.8-.7 4.8-4C22 12 18.5 20 12 20S2 12 8 7.999C8 5 10.2 2.8 12 2Z" />
          </svg>
        </span>
      ) : null}
      {variant === "all" ? (
        <span className="sell-option-picker__section-ico" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </span>
      ) : null}
      <span>{label}</span>
    </p>
  );
}
