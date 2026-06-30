"use client";

import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import { cn } from "@/lib/cn";

export type BottomNavIconType = "home" | "search" | "sell" | "saved" | "account";

type BottomNavIcon3DProps = {
  type: BottomNavIconType;
  active?: boolean;
  className?: string;
  /** Tab icons render at 32px; sell stays at 34px inside the sell button. */
  size?: "tab" | "sell";
};

const TAB_ICON_PX = 32;
const SELL_ICON_PX = 34;

export function BottomNavIcon3D({ type, active, className, size = "tab" }: BottomNavIcon3DProps) {
  const px = size === "sell" ? SELL_ICON_PX : TAB_ICON_PX;

  return (
    <Fluency3DIcon
      icon={type}
      size={px}
      className={cn(
        "transition-opacity duration-200",
        active ? "opacity-100" : "opacity-90",
        className,
      )}
    />
  );
}
