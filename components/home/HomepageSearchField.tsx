"use client";

import { memo, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { captureHomepageScroll } from "@/lib/navigation/homepage-scroll-restore";
import { SEARCH_SYSTEM_V1 } from "@/lib/search/search-system-v1-lock";
import { SearchBarSearchIcon } from "@/features/search/components/SearchBarIcons";
import { transitionFast } from "@/components/ui/tokens";

export type HomepageSearchFieldProps = {
  /** Stable id required — must match between server and client markup. */
  inputId: string;
  className?: string;
};

/**
 * Homepage search entry — Search Bar Icon Freeze.
 * Navigates to Global Search `/search` (not Browse `/browse`).
 * memo: header scroll / badge updates must not re-render this field.
 */
export const HomepageSearchField = memo(function HomepageSearchField({
  inputId,
  className,
}: HomepageSearchFieldProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function goToSearch() {
    captureHomepageScroll();
    router.push("/search");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToSearch();
    }
  }

  return (
    <div className={cn("homepage-search", className)} data-search-bar="v1-icon-freeze">
      <div role="search" className="homepage-search__form">
        <label htmlFor={inputId} className="sr-only">
          Search products
        </label>

        <div className={cn("homepage-search__control", transitionFast)}>
          <span className="homepage-search__icon" aria-hidden>
            <SearchBarSearchIcon />
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
            role="searchbox"
            data-header-search="field"
            onFocus={goToSearch}
            onClick={goToSearch}
            onKeyDown={handleKeyDown}
            className="homepage-search__input"
          />
        </div>
      </div>
    </div>
  );
});
