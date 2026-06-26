"use client";

import { useEffect, useState } from "react";
import { formatAuctionCountdown } from "@/lib/auctions/utils";
import { useVisibilityInterval } from "@/lib/performance/hooks";
import { cn } from "@/lib/cn";

type AuctionCountdownProps = {
  endsAt: string | null | undefined;
  urgent?: boolean;
  className?: string;
};

export function AuctionCountdown({ endsAt, urgent = false, className }: AuctionCountdownProps) {
  const [label, setLabel] = useState(() => formatAuctionCountdown(endsAt));

  useEffect(() => {
    setLabel(formatAuctionCountdown(endsAt));
  }, [endsAt]);

  useVisibilityInterval(() => {
    setLabel(formatAuctionCountdown(endsAt));
  }, 1000);

  return (
    <span className={cn("auctions-countdown", !urgent && "auctions-countdown--calm", className)}>
      {label}
    </span>
  );
}
