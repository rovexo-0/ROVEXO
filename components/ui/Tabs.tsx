"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type TabsProps = {
  tabs: Array<{ id: string; label: string }>;
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  children?: ReactNode;
};

export function Tabs({ tabs, activeId, onChange, className, children }: TabsProps) {
  return (
    <div className={className}>
      <div className="flex gap-ds-2 overflow-x-auto border-b border-[var(--ds-color-border)] pb-ds-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            className={cn(
              "rx-chip whitespace-nowrap",
              tab.id === activeId ? "border-primary/35 bg-primary/10 text-primary" : "text-text-secondary",
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-ds-4" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
