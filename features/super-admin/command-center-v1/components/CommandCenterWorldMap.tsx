"use client";

import { useMemo } from "react";
import type { CommandCenterCountryMarker } from "@/lib/super-admin/command-center-v1/types";
import { getCountryCentroid } from "@/features/super-admin/live-analytics/lib/country-centroids";
import { LiveStatusBadge } from "@/features/super-admin/command-center-v1/components/LiveStatusBadge";

type CommandCenterWorldMapProps = {
  countries: CommandCenterCountryMarker[];
};

export function CommandCenterWorldMap({ countries }: CommandCenterWorldMapProps) {
  const hasVisitors = countries.some((country) => country.activeUsers > 0);

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
          size: 8 + intensity * 18,
          opacity: 0.35 + intensity * 0.65,
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null);
  }, [countries]);

  return (
    <section className="cc1-panel" aria-labelledby="cc1-map-heading">
      <header className="cc1-panel__header">
        <h2 id="cc1-map-heading" className="cc1-panel__title">
          Live World Map
        </h2>
        <p className="cc1-panel__subtitle">Visitors, buyers, sellers, and orders by country</p>
      </header>
      <div className="cc1-map">
        <svg viewBox="0 0 100 50" className="cc1-map__svg" role="img" aria-label="Live world activity map">
          <defs>
            <radialGradient id="cc1-map-glow">
              <stop offset="0%" stopColor="rgba(8, 145, 178, 0.95)" />
              <stop offset="70%" stopColor="rgba(8, 145, 178, 0.35)" />
              <stop offset="100%" stopColor="rgba(8, 145, 178, 0)" />
            </radialGradient>
          </defs>
          <path
            d="M6,22 C12,18 18,20 24,18 C30,16 36,14 42,16 C48,18 54,15 60,17 C66,19 72,16 78,18 C84,20 90,18 94,20 L94,42 C88,44 82,42 76,43 C70,44 64,46 58,45 C52,44 46,46 40,45 C34,44 28,46 22,45 C16,44 10,46 6,44 Z"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="0.4"
          />
          {hasVisitors
            ? markers.map((marker) => (
                <g key={marker.code} transform={`translate(${marker.x}, ${marker.y})`}>
                  <circle r={marker.size / 4} fill="url(#cc1-map-glow)" opacity={marker.opacity} />
                  <circle r={marker.size / 10} fill="#0891b2" />
                  <title>
                    {marker.flag} {marker.name}: {marker.activeUsers} active
                  </title>
                </g>
              ))
            : null}
        </svg>
        {hasVisitors ? (
          <ul className="cc1-map__legend">
            {countries.slice(0, 6).map((country) => (
              <li key={country.code}>
                {country.flag} {country.name} · {country.activeUsers}
              </li>
            ))}
          </ul>
        ) : (
          <div className="cc1-map__empty" role="status" aria-live="polite">
            <p className="cc1-map__empty-title">Waiting for first visitor...</p>
            <LiveStatusBadge label="Waiting" variant="waiting" />
          </div>
        )}
      </div>
    </section>
  );
}
