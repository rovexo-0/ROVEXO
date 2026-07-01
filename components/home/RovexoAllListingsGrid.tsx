"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/home/RovexoAllListingsGrid.module.css";

type RovexoAllListingsGridProps = {
  children: ReactNode;
  className?: string;
};

export const RovexoAllListingsGrid = forwardRef<HTMLDivElement, RovexoAllListingsGridProps>(
  function RovexoAllListingsGrid({ children, className }, ref) {
    return (
      <div ref={ref} className={cn(styles.grid, className)}>
        {children}
      </div>
    );
  },
);
