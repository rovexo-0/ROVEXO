"use client";

import { useCallback, useState } from "react";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import {
  getSearchCurrentCity,
  getSearchLocationMode,
  setSearchLocationMode,
  type SearchLocationMode,
} from "@/features/search/utils/location-preference";

type SearchLocationFilterProps = {
  onChange?: (mode: SearchLocationMode, city?: string) => void;
  className?: string;
  compact?: boolean;
};

export function SearchLocationFilter({
  onChange,
  className,
  compact = false,
}: SearchLocationFilterProps) {
  const [mode, setMode] = useState<SearchLocationMode>(() => getSearchLocationMode());
  const [currentCity] = useState<string | null>(() => getSearchCurrentCity());

  const applyMode = useCallback(
    (nextMode: SearchLocationMode) => {
      setSearchLocationMode(nextMode);
      setMode(nextMode);

      if (nextMode === "current" || nextMode === "nearby") {
        onChange?.(nextMode, currentCity ?? undefined);
        return;
      }

      onChange?.(nextMode, undefined);
    },
    [currentCity, onChange],
  );

  const currentLabel =
    currentCity && mode === "current" ? `📍 ${currentCity}` : "Current City";
  const nearbyLabel = currentCity && mode === "nearby" ? `📍 ${currentCity}` : "Nearby";

  return (
    <div className={cn("flex flex-col gap-ds-2", className)}>
      {!compact ? (
        <p className="text-xs font-medium text-text-secondary">Location</p>
      ) : null}
      <div
        className={cn("flex flex-wrap gap-ds-2", compact && "min-h-[36px] items-center")}
        role="group"
        aria-label="Location filter"
      >
        <CategoryChip
          label={nearbyLabel}
          active={mode === "nearby"}
          onClick={() => applyMode("nearby")}
          disabled={!currentCity}
          title={currentCity ? "Show listings in your saved city" : "Save a city to use nearby search"}
          className="min-h-[36px]"
        />
        <CategoryChip
          label={currentLabel}
          active={mode === "current"}
          onClick={() => applyMode("current")}
          disabled={!currentCity}
          title={currentCity ? "Filter by your saved city" : "Save a city to filter by location"}
          className="min-h-[36px]"
        />
        <CategoryChip
          label="All Locations"
          active={mode === "any"}
          onClick={() => applyMode("any")}
          className="min-h-[36px]"
        />
      </div>
      {!currentCity && (mode === "current" || mode === "nearby") ? (
        <p className="text-xs text-text-muted" role="status">
          Location filters use your saved city only. No GPS is used during search.
        </p>
      ) : null}
    </div>
  );
}
