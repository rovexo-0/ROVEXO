"use client";

import Link from "next/link";
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

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
        <SearchIcon className="header-search-bar-2026__icon" />
        <span className="header-search-bar-2026__placeholder">{placeholder}</span>
      </Link>
    </div>
  );
}
