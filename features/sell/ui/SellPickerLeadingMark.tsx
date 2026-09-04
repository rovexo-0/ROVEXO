"use client";

import { useState } from "react";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import type { EnrichedPickerOption } from "@/features/sell/ui/sell-picker-presentation-v1";

type Props = {
  option: EnrichedPickerOption;
  kind: "brand" | "material" | "condition" | "colour" | "compatibility" | "generic";
};

const MATERIAL_EMOJI: Record<string, string> = {
  cotton: "🌿",
  wool: "🧶",
  silk: "✨",
  leather: "👜",
  denim: "👖",
  linen: "🧺",
  metal: PLATFORM_EMOJI.settings,
  wood: "🪵",
  glass: "🪟",
  foam: "🫧",
  synthetic: "🧪",
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
  return (
    <PlatformEmoji
      emoji={MATERIAL_EMOJI[glyph] ?? PLATFORM_EMOJI.tag}
      size={20}
      className="sell-picker-mark__glyph"
    />
  );
}

function ConditionGlyph({ tone }: { tone: string }) {
  return (
    <span className="sell-picker-mark sell-picker-mark--condition" style={{ background: `${tone}22`, color: tone }}>
      <PlatformEmoji emoji={PLATFORM_EMOJI.verified} size={20} className="sell-picker-mark__glyph" />
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
        <PlatformEmoji emoji={PLATFORM_EMOJI.link} size={20} className="sell-picker-mark__glyph" />
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
          <PlatformEmoji emoji={PLATFORM_EMOJI.star} size={14} />
        </span>
      ) : null}
      {variant === "all" ? (
        <span className="sell-option-picker__section-ico" aria-hidden>
          <PlatformEmoji emoji={PLATFORM_EMOJI.menu} size={14} />
        </span>
      ) : null}
      <span>{label}</span>
    </p>
  );
}
