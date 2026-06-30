"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";
import { focusRing, transitionFast } from "@/components/ui/tokens";

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
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 0 0 6.75-6.75v-1.5m-6.75 8.25a3.75 3.75 0 0 1-3.75-3.75v-1.5m9 0V9.75a9 9 0 0 0-9-9 9 9 0 0 0-9 9v1.5m9 0h.008v.008H12V12Z" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.813 4.5h6.374a2.31 2.31 0 0 1 2.006 1.175l1.015 1.8A2.31 2.31 0 0 0 20.25 8.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18V8.25c0-.994.627-1.881 1.566-2.212l1.511-.863Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}

const actionButtonClass = cn(
  "premium-btn flex items-center justify-center rounded-ds-full text-primary-foreground",
  "bg-[image:var(--ds-gradient-primary)]",
  focusRing,
  transitionFast,
);

export function HeaderSearchBar({
  inputId,
  placeholder = "Search for anything...",
  defaultValue = "",
  className,
  size = "large",
}: HeaderSearchBarProps) {
  const generatedId = useId();
  const resolvedInputId = inputId ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const searchOverlay = useSearchOverlayOptional();
  const useOverlay = Boolean(searchOverlay);

  const [query, setQuery] = useState(defaultValue);
  const [isActive, setIsActive] = useState(false);

  function openSearchOverlay() {
    if (!searchOverlay) return;
    searchOverlay.open(query);
    inputRef.current?.blur();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openSearchOverlay();
  }

  const controlHeight = "var(--ds-search-bar-h)";
  const actionSize = size === "inline" ? "h-9 w-9" : "h-9 w-9";
  const miniActionSize = size === "inline" ? "h-7 w-7" : "h-8 w-8";
  const searchIconSize = size === "inline" ? "h-4 w-4" : "h-[1.125rem] w-[1.125rem]";
  const inputText = size === "inline" ? "text-xs" : "text-sm lg:text-base";
  const leftPad = size === "inline" ? "pl-2.5" : "pl-3.5";
  const rightPad = size === "inline" ? "pr-1 gap-0.5" : "pr-1.5 sm:pr-2 gap-1";
  const showQuickActions = size !== "inline";

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <form action="/search" method="GET" role="search" onSubmit={handleSubmit}>
        <label htmlFor={resolvedInputId} className="sr-only">
          Search products on ROVEXO
        </label>

        <div
          className={cn(
            "search-bar-2026 premium-glass relative flex w-full items-center overflow-hidden rounded-ds-full",
            "premium-depth-1",
            "transition-[border-color,box-shadow,transform] duration-ds-normal ease-ds-spring",
            "hover:-translate-y-px",
            "focus-within:ring-2 focus-within:ring-primary/30 focus-within:shadow-[0_0_20px_rgb(59_130_246/0.25)]",
            isActive && "ring-2 ring-primary/30 shadow-[0_0_20px_rgb(59_130_246/0.25)]",
            "active:scale-[0.995]",
          )}
          style={{ height: controlHeight }}
          data-header-search="bar"
        >
          <span className={cn("relative z-[1] pointer-events-none flex h-full shrink-0 items-center text-primary", leftPad)}>
            <SearchIcon className={searchIconSize} />
          </span>

          <input
            ref={inputRef}
            id={resolvedInputId}
            type="search"
            name="q"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            readOnly={useOverlay}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              setIsActive(true);
              openSearchOverlay();
            }}
            onBlur={() => setIsActive(false)}
            className={cn(
              "relative z-[1] min-w-0 flex-1 border-0 bg-transparent px-1.5 text-text-primary outline-none",
              inputText,
              "placeholder:text-text-muted placeholder:transition-opacity focus:placeholder:opacity-60",
              useOverlay && "cursor-pointer",
            )}
          />

          <div className={cn("relative z-[1] flex shrink-0 items-center", rightPad)}>
            {showQuickActions && (
              <>
                <button
                  type="button"
                  aria-label="Voice search coming soon"
                  disabled
                  className={cn(
                    "flex items-center justify-center rounded-ds-full text-text-secondary opacity-60",
                    miniActionSize,
                    focusRing,
                  )}
                >
                  <PremiumIcon size="sm" className="!h-8 !w-8 shadow-none">
                    <MicIcon />
                  </PremiumIcon>
                </button>
                <Link
                  href="/sell"
                  aria-label="Add photos to sell"
                  className={cn("flex items-center justify-center rounded-ds-full", miniActionSize, focusRing)}
                >
                  <PremiumIcon size="sm" className="!h-8 !w-8">
                    <CameraIcon />
                  </PremiumIcon>
                </Link>
                <Link
                  href="/assistant"
                  aria-label="AI Assistant"
                  className={cn("flex items-center justify-center rounded-ds-full", miniActionSize, focusRing)}
                >
                  <PremiumIcon size="sm" className="!h-8 !w-8" glow>
                    <SparklesIcon />
                  </PremiumIcon>
                </Link>
              </>
            )}
            <button type="submit" aria-label="Search" className={cn(actionButtonClass, actionSize)}>
              <SearchIcon className={size === "inline" ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
