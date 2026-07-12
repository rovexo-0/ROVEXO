import type { ReactNode } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import type { BottomNavTab } from "@/components/ui/BottomNavigation";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { cn } from "@/lib/cn";

export type DiscoveryPageShellProps = {
  children: ReactNode;
  bottomNavTab?: BottomNavTab;
  className?: string;
  mainClassName?: string;
};

/**
 * Discovery/browse shell — matches Homepage + Search header chrome (RovexoHeaderV2).
 */
export function DiscoveryPageShell({
  children,
  bottomNavTab = "search",
  className,
  mainClassName,
}: DiscoveryPageShellProps) {
  return (
    <BetaAppShell bottomNavTab={bottomNavTab} className={className}>
      <RovexoHeaderV2 />
      <HubPageMain
        className={cn(
          "mx-auto w-full max-w-7xl px-ds-4 py-ds-5 pt-[calc(7.5rem+env(safe-area-inset-top))]",
          mainClassName,
        )}
      >
        {children}
      </HubPageMain>
    </BetaAppShell>
  );
}
