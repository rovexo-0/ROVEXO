"use client";

import { useMemo } from "react";
import type { LiveCountryRow } from "@/lib/analytics/live-center/types";
import { getCountryCentroid } from "@/features/super-admin/live-analytics/lib/country-centroids";

type LiveWorldMapProps = {
  countries: LiveCountryRow[];
};

export function LiveWorldMap({ countries }: LiveWorldMapProps) {
  const markers = useMemo(() => {
    const max = Math.max(...countries.map((country) => country.activeUsers), 1);
    return countries
      .map((country) => {
        const position = getCountryCentroid(country.code);
        if (!position) return null;
        const intensity = country.activeUsers / max;
        return {
          code: country.code,
          name: country.name,
          flag: country.flag,
          activeUsers: country.activeUsers,
          x: position[0],
          y: position[1],
          size: 10 + intensity * 22,
          opacity: 0.35 + intensity * 0.65,
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null);
  }, [countries]);

  return (
    <section className="live-analytics-glass rounded-[24px] p-ds-4">
      <header className="mb-ds-3">
        <h3 className="text-sm font-semibold text-text-primary">🗺️ Global Map</h3>
        <p className="mt-ds-1 text-xs text-text-secondary">
          Glow intensity reflects active visitors per country
        </p>
      </header>

      <div className="live-analytics-map relative overflow-hidden rounded-ds-xl border border-border/50 bg-gradient-to-b from-violet-50 to-purple-100/60">
        <svg viewBox="0 0 100 50" className="h-auto w-full" role="img" aria-label="World visitor map">
          <defs>
            <radialGradient id="live-map-glow">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.95)" />
              <stop offset="70%" stopColor="rgba(34, 197, 94, 0.35)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
            </radialGradient>
          </defs>

          <path
            d="M6,22 C12,18 18,20 24,18 C30,16 36,14 42,16 C48,18 54,15 60,17 C66,19 72,16 78,18 C84,20 90,18 94,20 L94,42 C88,44 82,42 76,43 C70,44 64,46 58,45 C52,44 46,46 40,45 C34,44 28,46 22,45 C16,44 10,46 6,44 Z"
            fill="rgba(255,255,255,0.55)"
            stroke="rgba(148,163,184,0.45)"
            strokeWidth="0.4"
          />

          {markers.map((marker) => (
            <g key={marker.code} transform={`translate(${marker.x}, ${marker.y})`}>
              <circle
                r={marker.size / 4}
                fill="url(#live-map-glow)"
                opacity={marker.opacity}
                className="live-analytics-map-pulse"
              />
              <circle r={marker.size / 10} fill="rgba(22,163,74,0.9)" />
              <title>
                {marker.flag} {marker.name}: {marker.activeUsers} active
              </title>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
