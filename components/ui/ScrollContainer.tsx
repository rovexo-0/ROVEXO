"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  RX_SCROLL_FOOTER,
  RX_SCROLL_PAGE,
  RX_SCROLL_PAGE_NO_NAV,
  RX_SCROLL_PAGE_WITH_NAV,
} from "@/lib/mobile-ui/scroll-standard";

export type ScrollContainerProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Reserve space for fixed bottom navigation (default true) */
  withBottomNav?: boolean;
  id?: string;
} & Omit<ComponentPropsWithoutRef<"main">, "as" | "children" | "className" | "id">;

/**
 * Canonical scrollable page region — document scroll with safe-area clearance.
 */
export function ScrollContainer({
  as: Component = "main",
  children,
  className,
  withBottomNav = true,
  id,
  ...rest
}: ScrollContainerProps) {
  return (
    <Component
      {...rest}
      id={id}
      data-rx-scroll-page="v1"
      className={cn(
        // Literals keep scroll tokens on the DOM even if named-import binding flakes in chunk graphs.
        "rx-scroll-page",
        withBottomNav ? "rx-scroll-page--with-nav" : "rx-scroll-page--no-nav",
        RX_SCROLL_PAGE,
        withBottomNav ? RX_SCROLL_PAGE_WITH_NAV : RX_SCROLL_PAGE_NO_NAV,
        className,
      )}
    >
      {children}
    </Component>
  );
}

export type ScrollFooterProps = {
  children: ReactNode;
  className?: string;
};

/** Sticky footer that stays reachable while the page scrolls. */
export function ScrollFooter({ children, className }: ScrollFooterProps) {
  return <div className={cn(RX_SCROLL_FOOTER, className)}>{children}</div>;
}
