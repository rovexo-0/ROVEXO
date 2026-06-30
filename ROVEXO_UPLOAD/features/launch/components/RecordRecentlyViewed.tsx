"use client";

import { useEffect } from "react";

type RecordRecentlyViewedProps = {
  productSlug: string;
};

export function RecordRecentlyViewed({ productSlug }: RecordRecentlyViewedProps) {
  useEffect(() => {
    void fetch("/api/recently-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug }),
    }).catch(() => undefined);
  }, [productSlug]);

  return null;
}
