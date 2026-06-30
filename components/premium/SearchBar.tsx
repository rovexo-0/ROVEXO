"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useSearchOverlayOptional } from "@/features/search/client";

type SearchBarProps = {
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  size?: "default" | "compact";
};

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

export function SearchBar({
  placeholder = "Search for anything...",
  defaultValue = "",
  className,
  size = "default",
}: SearchBarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchOverlay = useSearchOverlayOptional();
  const [query, setQuery] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  function openOverlay() {
    searchOverlay?.open(query);
    inputRef.current?.blur();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openOverlay();
  }

  const isCompact = size === "compact";

  return (
    <form action="/search" method="GET" role="search" onSubmit={handleSubmit} className={cn("w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        Search ROVEXO
      </label>
      <motion.div
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={cn(
          "premium-search-bar flex items-center gap-2 rounded-full border border-white/50 bg-white/70 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.35)] backdrop-blur-2xl",
          "transition-shadow duration-300",
          focused && "border-violet-300/60 shadow-[0_12px_40px_-10px_rgba(99,102,241,0.45)]",
          isCompact ? "h-10 px-3" : "h-12 px-4",
        )}
      >
        <SearchGlyph className={cn("shrink-0 text-violet-600", isCompact ? "h-4 w-4" : "h-5 w-5")} />
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
          onFocus={() => {
            setFocused(true);
            openOverlay();
          }}
          onBlur={() => setFocused(false)}
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400",
            isCompact ? "text-sm" : "text-sm lg:text-base",
            searchOverlay && "cursor-pointer",
          )}
        />
        <Link
          href="/sell/camera"
          aria-label="Import listing with camera"
          className="hidden shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-violet-50 hover:text-violet-600 sm:flex"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.813 4.5h6.374a2.31 2.31 0 0 1 2.006 1.175l1.015 1.8A2.31 2.31 0 0 0 20.25 8.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18V8.25c0-.994.627-1.881 1.566-2.212l1.511-.863Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          </svg>
        </Link>
        <button
          type="submit"
          aria-label="Search"
          className={cn(
            "shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md transition hover:brightness-110",
            isCompact ? "h-8 w-8" : "h-9 w-9",
          )}
        >
          <SearchGlyph className="mx-auto h-4 w-4" />
        </button>
      </motion.div>
    </form>
  );
}
