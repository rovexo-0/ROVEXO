"use client";

import { useState, type SyntheticEvent } from "react";
import { isFailedImageSrc, markFailedImageSrc } from "@/lib/media/failed-image-src";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

function pickCardSrc(preferred: string, fullUrl?: string | null): string {
  const preferredTrim = preferred?.trim() || "";
  const fullTrim = fullUrl?.trim() || "";

  if (
    preferredTrim &&
    isRenderableImageSrc(preferredTrim) &&
    !isFailedImageSrc(preferredTrim)
  ) {
    return preferredTrim;
  }

  if (fullTrim && isRenderableImageSrc(fullTrim) && !isFailedImageSrc(fullTrim)) {
    return fullTrim;
  }

  return PRODUCT_IMAGE_FALLBACK;
}

function isDistinctThumbSrc(src: string, fullUrl?: string | null): boolean {
  const fullTrim = fullUrl?.trim() || "";
  if (!fullTrim || src === fullTrim) return false;
  return /-thumb\./i.test(src);
}

/**
 * One-shot card image resolve: preferred src → on first load failure → full URL.
 * Never re-requests a URL already marked failed in this session.
 * Distinct `-thumb.` URLs bypass next/image optimizer so a missing Storage
 * object cannot log "isn't a valid image … received null".
 */
export function useCardImageSrc(preferred: string, fullUrl?: string | null) {
  const [src, setSrc] = useState(() => pickCardSrc(preferred, fullUrl));
  const [preferredSeen, setPreferredSeen] = useState(preferred);
  const [fullSeen, setFullSeen] = useState(fullUrl ?? "");

  if (preferred !== preferredSeen || (fullUrl ?? "") !== fullSeen) {
    setPreferredSeen(preferred);
    setFullSeen(fullUrl ?? "");
    setSrc(pickCardSrc(preferred, fullUrl));
  }

  const onError = (event?: SyntheticEvent<HTMLImageElement, Event>) => {
    void event;
    markFailedImageSrc(src);
    const next = pickCardSrc(preferred, fullUrl);
    if (next !== src) {
      setSrc(next);
    }
  };

  return {
    src,
    onError,
    /** Bypass optimizer only while attempting a distinct thumbnail URL. */
    unoptimized: isDistinctThumbSrc(src, fullUrl),
  };
}
