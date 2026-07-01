"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/premium/AllListingsGrid.module.css";

type AllListingsGridProps = {
  children: ReactNode;
  className?: string;
};

export const AllListingsGrid = forwardRef<HTMLDivElement, AllListingsGridProps>(
  function AllListingsGrid({ children, className }, ref) {
    return (
      <div ref={ref} className={cn(styles.grid, className)}>
        {children}
      </div>
    );
  },
);
