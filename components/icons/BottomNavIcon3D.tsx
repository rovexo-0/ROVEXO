"use client";

import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { resolveBottomNavGlassIcon } from "@/lib/icons/resolve";
import { cn } from "@/lib/cn";

export type BottomNavIconType = "home" | "search" | "sell" | "saved" | "account";

type BottomNavIcon3DProps = {
  type: BottomNavIconType;
  active?: boolean;
  className?: string;
  size?: "tab" | "sell";
};

const SELL_ICON_PX = 28;

export function BottomNavIcon3D({
  type,
  active = false,
  className,
  size = "tab",
}: BottomNavIcon3DProps) {
  const isSell = size === "sell";

  return (
    <span
      className={cn(
        "rx-bottom-nav-icon",
        isSell ? "rx-bottom-nav-icon--sell-inner" : "rx-bottom-nav-icon--tab",
        active && !isSell && "rx-bottom-nav-icon--active",
        className,
      )}
      style={{ width: isSell ? SELL_ICON_PX : undefined, height: isSell ? SELL_ICON_PX : undefined }}
      aria-hidden
    >
      <RovexoIcon
        icon={resolveBottomNavGlassIcon(type)}
        variant={isSell ? undefined : "bottomNav"}
        size={isSell ? SELL_ICON_PX : undefined}
        className={isSell ? "rx-bottom-nav-item__icon" : "rx-bottom-nav-tab-icon"}
      />
    </span>
  );
}
