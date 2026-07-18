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

/** Standard scrollable hub/page main — bottom-nav clearance + safe-area. */
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
      className={cn("mx-auto flex w-full flex-col gap-ds-4 px-ds-4 py-ds-5", className)}
    >
      {children}
    </ScrollContainer>
  );
}
