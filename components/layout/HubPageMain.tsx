"use client";

import type { ReactNode } from "react";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { cn } from "@/lib/cn";

type HubPageMainProps = {
  children: ReactNode;
  className?: string;
  withBottomNav?: boolean;
  id?: string;
};

/**
 * Standard scrollable hub/page main — 100% phone width + 16px inset (Phone Width Freeze).
 */
export function HubPageMain({
  children,
  className,
  withBottomNav = true,
  id,
}: HubPageMainProps) {
  return (
    <ScrollContainer
      id={id}
      withBottomNav={withBottomNav}
      className={cn(
        "hub-page-main flex w-full max-w-none flex-col gap-ds-4 px-[16px] py-ds-5",
        className,
      )}
    >
      {children}
    </ScrollContainer>
  );
}
