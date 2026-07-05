"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type RovexoAllListingsGridProps = {
  children: ReactNode;
  className?: string;
};

export const RovexoAllListingsGrid = forwardRef<HTMLDivElement, RovexoAllListingsGridProps>(
  function RovexoAllListingsGrid({ children, className }, ref) {
    return (
      <div
        ref={ref}
        data-homepage-listing-container="grid"
        className={cn("home-v1-listing-grid-lock", className)}
      >
        {children}
      </div>
    );
  },
);
