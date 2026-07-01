"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";

type RovexoSearchBarProps = {
  placeholder?: string;
  defaultValue?: string;
  className?: string;
};

export function RovexoSearchBar({
  placeholder = "Search for anything...",
  defaultValue = "",
  className,
}: RovexoSearchBarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchOverlay = useSearchOverlayOptional();
  const [query, setQuery] = useState(defaultValue);

  function openOverlay() {
    searchOverlay?.open(query);
    inputRef.current?.blur();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openOverlay();
  }

  return (
    <form action="/search" method="GET" role="search" onSubmit={handleSubmit} className={cn("min-w-0 flex-1", className)}>
      <label htmlFor={inputId} className="sr-only">
        Search ROVEXO
      </label>
      <div className="home-v1-search-bar">
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          name="q"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          readOnly={Boolean(searchOverlay)}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => openOverlay()}
          className={cn("home-v1-search-bar__input", searchOverlay && "cursor-pointer")}
        />
        <button type="submit" aria-label="Search" className="home-v1-search-bar__icon-btn">
          <RovexoIcon icon={RovexoIcons.search.search} variant="settings" />
        </button>
      </div>
    </form>
  );
}
