"use client";

import type { ReactNode } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import type { BottomNavTab } from "@/components/ui/BottomNavigation";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { cn } from "@/lib/cn";

export type CanonicalPageShellProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  children: ReactNode;
  bottomNavTab?: BottomNavTab;
  showBottomNav?: boolean;
  className?: string;
  contentClassName?: string;
  scrollClassName?: string;
  version?: string;
};

/**
 * Platform-standard page shell — CanonicalPageHeader + scrollable body.
 * Visual reference: My Account module subpages (spacing, header, safe-area).
 */
export function CanonicalPageShell({
  title,
  backHref,
  backLabel,
  onBack,
  rightAction,
  children,
  bottomNavTab,
  showBottomNav = true,
  className,
  contentClassName,
  scrollClassName,
  version = "v1.0-canonical",
}: CanonicalPageShellProps) {
  return (
    <BetaAppShell bottomNavTab={bottomNavTab} showBottomNav={showBottomNav} className={className}>
      <div className="flex min-h-full flex-col" data-canonical-page-shell={version}>
        <CanonicalPageHeader
          title={title}
          backHref={backHref}
          backLabel={backLabel}
          onBack={onBack}
          rightAction={rightAction}
        />
        <ScrollContainer withBottomNav={showBottomNav} className={cn("flex-1", scrollClassName)}>
          <div
            className={cn(
              "pcu-module pcu-module--flush mx-auto flex w-full max-w-[640px] flex-col gap-ds-3",
              contentClassName,
            )}
          >
            {children}
          </div>
        </ScrollContainer>
      </div>
    </BetaAppShell>
  );
}
