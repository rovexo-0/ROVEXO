"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  MANUAL_LISTING_CITIES,
  reverseGeocodeListingCity,
} from "@/lib/sell/listing-location";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";
import { FieldError } from "@/features/sell/components/FieldError";
import { focusRing } from "@/components/ui/tokens";

type SellLocationFieldProps = {
  form: SellFormController;
  error?: string;
  disableAutoDetect?: boolean;
};

type DetectionState = "idle" | "detecting" | "denied" | "failed";

export function SellLocationField({
  form,
  error,
  disableAutoDetect = false,
}: SellLocationFieldProps) {
  const { draft, updateDraft } = form;
  const geolocationSupported =
    typeof window !== "undefined" && "geolocation" in navigator;
  const [detectionState, setDetectionState] = useState<DetectionState>(() =>
    geolocationSupported ? "idle" : "failed",
  );
  const detectionStartedRef = useRef(false);

  useEffect(() => {
    if (disableAutoDetect || detectionStartedRef.current || draft.locationCity || !geolocationSupported) {
      return;
    }

    detectionStartedRef.current = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setDetectionState("detecting");
        try {
          const city = await reverseGeocodeListingCity(
            position.coords.latitude,
            position.coords.longitude,
          );
          if (city) {
            updateDraft({ locationCity: city });
            setDetectionState("idle");
          } else {
            setDetectionState("failed");
          }
        } catch {
          setDetectionState("failed");
        }
      },
      (geoError) => {
        setDetectionState(
          geoError.code === geoError.PERMISSION_DENIED ? "denied" : "failed",
        );
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 12_000,
      },
    );
  }, [disableAutoDetect, draft.locationCity, geolocationSupported, updateDraft]);

  const showUnavailableMessage =
    detectionState === "denied" || detectionState === "failed";
  const statusMessage =
    detectionState === "detecting"
      ? "Detecting your city…"
      : showUnavailableMessage
        ? "Location unavailable. Choose your city manually."
        : draft.locationCity
          ? "Detected city. You can change it before publishing."
          : null;

  return (
    <div className="border-t border-border px-ds-4 py-ds-3">
      <div className="flex flex-col gap-ds-2">
        <label htmlFor="sell-location" className="text-sm font-medium text-text-primary">
          Location
        </label>
        {statusMessage ? (
          <p className="text-xs text-text-secondary" role="status">
            {statusMessage}
          </p>
        ) : null}

        <div className="relative">
          <span className="pointer-events-none absolute left-ds-3 top-1/2 -translate-y-1/2" aria-hidden>
            📍
          </span>
          <select
            id="sell-location"
            value={draft.locationCity ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              updateDraft({ locationCity: value || null });
              if (value) {
                setDetectionState("idle");
              }
            }}
            className={cn(
              "rx-input min-h-ds-7 w-full rounded-ds-sm py-ds-2 pl-ds-8 pr-ds-3 text-sm",
              focusRing,
              error && "border-danger ring-1 ring-danger/30",
            )}
          >
            <option value="">Choose your city</option>
            {MANUAL_LISTING_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <FieldError message={error} />
      </div>
    </div>
  );
}
