"use client";

import { useRef, type KeyboardEvent } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { useClientHydrated } from "@/lib/react/use-client-hydrated";
import { useSearchOverlayOptional } from "@/features/search/client";
import { captureHomepageScroll } from "@/lib/navigation/homepage-scroll-restore";
import { SEARCH_SYSTEM_V1 } from "@/lib/search/search-system-v1-lock";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export type HomepageSearchFieldProps = {
  /** Stable id required — must match between server and client markup. */
  inputId: string;
  className?: string;
};

/**
 * Homepage search entry — icon + placeholder only.
 * Focus / click / Enter opens the canonical Search Overlay (Camera + Close live there).
 * No parallel suggestion dropdown. No camera on the homepage field.
 */
export function HomepageSearchField({ inputId, className }: HomepageSearchFieldProps) {
  const hydrated = useClientHydrated();
  const searchOverlay = useSearchOverlayOptional();
  const inputRef = useRef<HTMLInputElement>(null);

  function openOverlay() {
    captureHomepageScroll();
    if (searchOverlay) {
      searchOverlay.open();
      return;
    }
    // Fail-closed: overlay provider missing — stay on field (never invent a second search UI).
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openOverlay();
    }
  }

  return (
    <div className={cn("homepage-search", className)}>
      <div role="search" className="homepage-search__form">
        <label htmlFor={inputId} className="sr-only">
          Search products
        </label>

        <div className={cn("homepage-search__control", transitionFast)}>
          <span className="homepage-search__icon" aria-hidden>
            <RovexoIcon icon={RovexoIcons.navigation.search} size={20} />
          </span>

          <input
            ref={inputRef}
            id={inputId}
            type="search"
            name="q"
            readOnly
            placeholder={SEARCH_SYSTEM_V1.placeholder}
            autoComplete="off"
            enterKeyHint="search"
            role={hydrated ? "combobox" : "searchbox"}
            aria-expanded={hydrated ? Boolean(searchOverlay?.isOpen) : undefined}
            aria-haspopup="dialog"
            data-header-search="field"
            onFocus={openOverlay}
            onClick={openOverlay}
            onKeyDown={handleKeyDown}
            className={cn("homepage-search__input", focusRing)}
          />
        </div>
      </div>
    </div>
  );
}
