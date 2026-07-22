import type { ReactNode } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import type { BottomNavTab } from "@/components/ui/BottomNavigation";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { cn } from "@/lib/cn";

export type DiscoveryPageShellProps = {
  children: ReactNode;
  bottomNavTab?: BottomNavTab;
  className?: string;
  mainClassName?: string;
};

/**
 * Discovery/browse shell — header owned by root HeaderProvider (no per-page header).
 */
export function DiscoveryPageShell({
  children,
  bottomNavTab = "search",
  className,
  mainClassName,
}: DiscoveryPageShellProps) {
  return (
    <BetaAppShell bottomNavTab={bottomNavTab} className={className}>
      <HubPageMain
        className={cn(
          "w-full max-w-none px-[16px] py-ds-5 pt-[calc(7.5rem+env(safe-area-inset-top))]",
          mainClassName,
        )}
      >
        {children}
      </HubPageMain>
    </BetaAppShell>
  );
}
