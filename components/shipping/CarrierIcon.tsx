"use client";

import { cn } from "@/lib/cn";
import { resolveCarrierIconSrc } from "@/lib/shipping/carrier-icons-v1";
import { formatV1_0CarrierDisplayName } from "@/lib/shipping/v1-0-carrier-whitelist-v1";

type CarrierIconProps = {
  carrier: string;
  className?: string;
  size?: number;
};

/**
 * Canonical checkout/shipping carrier icon — one registry.
 * Local SVG brand assets render via plain <img> (Next optimizer rejects SVG
 * without dangerouslyAllowSVG — next/image would hide them).
 */
export function CarrierIcon({ carrier, className, size = 32 }: CarrierIconProps) {
  const src = resolveCarrierIconSrc(carrier);
  const label = formatV1_0CarrierDisplayName(carrier);

  if (!src) return null;

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-ds-sm bg-white", className)}
      style={{ width: size, height: size }}
      aria-hidden={false}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local carrier SVG registry; bypass Next optimizer */}
      <img
        src={src}
        alt={`${label} logo`}
        width={size}
        height={size}
        draggable={false}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
