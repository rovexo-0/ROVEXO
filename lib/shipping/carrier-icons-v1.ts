/**
 * ROVEXO v1.0 — canonical carrier icon registry (one asset per active carrier).
 *
 * Assets: brand wordmark/mark SVGs under /public/icons/carriers/*
 * Must render via plain <img> (see CarrierIcon) — not next/image.
 *
 * DPD / InPost: technical assets may remain on disk; customer-facing resolve = null.
 */

import type { V1_0ActiveCarrier } from "@/lib/shipping/v1-0-carrier-whitelist-v1";
import { resolveV1_0ActiveCarrier } from "@/lib/shipping/v1-0-carrier-whitelist-v1";

export const CARRIER_ICON_REGISTRY_V1 = {
  version: "v1.0",
  icons: {
    "Royal Mail": "/icons/carriers/royal-mail.svg",
    Evri: "/icons/carriers/evri.svg",
  } as const satisfies Record<V1_0ActiveCarrier, string>,
} as const;

export function resolveCarrierIconSrc(carrier: string | null | undefined): string | null {
  if (!carrier) return null;
  const active = resolveV1_0ActiveCarrier(carrier);
  if (!active) return null;
  return CARRIER_ICON_REGISTRY_V1.icons[active];
}
