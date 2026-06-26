"use client";

import { useState } from "react";
import { formatAuctionCountdown } from "@/lib/auctions/utils";
import { useVisibilityInterval } from "@/lib/performance/hooks";
import { cn } from "@/lib/cn";

type AuctionCountdownProps = {
  endsAt: string | null | undefined;
  urgent?: boolean;
  className?: string;
};

export function AuctionCountdown({ endsAt, urgent = false, className }: AuctionCountdownProps) {
  const [, setTick] = useState(0);

  useVisibilityInterval(() => {
    setTick((current) => current + 1);
  }, 1000);

  const label = formatAuctionCountdown(endsAt);

  return (
    <span className={cn("auctions-countdown", !urgent && "auctions-countdown--calm", className)}>
      {label}
    </span>
  );
}
