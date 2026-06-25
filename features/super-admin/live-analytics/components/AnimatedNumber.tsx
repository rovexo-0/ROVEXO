"use client";

import { useAnimatedNumber } from "@/features/super-admin/live-analytics/hooks/useAnimatedNumber";

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

export function AnimatedNumber({ value, decimals = 0, suffix = "", className }: AnimatedNumberProps) {
  const animated = useAnimatedNumber(value);
  const formatted =
    decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString();

  return (
    <span className={className}>
      {formatted}
      {suffix}
    </span>
  );
}
