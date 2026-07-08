"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type RovexoAllListingsGridProps = {
  children: ReactNode;
  className?: string;
  columns?: number;
};

export const RovexoAllListingsGrid = forwardRef<HTMLDivElement, RovexoAllListingsGridProps>(
  function RovexoAllListingsGrid({ children, className, columns = 2 }, ref) {
    return (
      <div
        ref={ref}
        data-homepage-listing-container="grid"
        data-homepage-grid-columns={columns}
        className={cn("home-v1-listing-grid-lock", className)}
        style={{ "--rx-home-grid-columns": columns } as CSSProperties}
      >
        {children}
      </div>
    );
  },
);
