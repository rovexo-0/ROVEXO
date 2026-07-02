"use client";

import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";
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
  const searchOverlay = useSearchOverlayOptional();

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <button
        id={inputId}
        type="button"
        role="search"
        aria-label={placeholder}
        data-header-search="bar"
        onClick={() => searchOverlay?.open()}
        className={cn("header-rx-search-bar w-full text-left", focusRing, transitionFast)}
      >
        <span className="header-search-bar-2026__icon" aria-hidden>
          <RovexoIcon icon={RovexoIcons.navigation.search} variant="header" />
        </span>
        <span className="header-search-bar-2026__placeholder">{placeholder}</span>
      </button>
    </div>
  );
}
