"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ListingGridProps = {
  children: ReactNode;
  className?: string;
};

export const ListingGrid = forwardRef<HTMLDivElement, ListingGridProps>(function ListingGrid(
  { children, className },
  ref,
) {
  return (
    <div ref={ref} className={cn("home-v1-listing-grid", className)}>
      {children}
    </div>
  );
});
