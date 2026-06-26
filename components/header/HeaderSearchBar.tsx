"use client";

import Link from "next/link";
import { BottomNavIcon3D } from "@/components/icons/BottomNavIcon3D";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import "./header-search-bar.css";

export type HeaderSearchBarProps = {
  inputId?: string;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  size?: "default" | "large" | "inline";
};

export function HeaderSearchBar({
  inputId = "header-search",
  placeholder = "Search ROVEXO...",
  className,
}: HeaderSearchBarProps) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <Link
        id={inputId}
        href="/search"
        role="search"
        aria-label={placeholder}
        data-header-search="bar"
        className={cn("header-search-bar-2026", focusRing, transitionFast)}
      >
        <span className="header-search-bar-2026__icon" aria-hidden>
          <BottomNavIcon3D type="search" size="tab" />
        </span>
        <span className="header-search-bar-2026__placeholder">{placeholder}</span>
      </Link>
    </div>
  );
}
