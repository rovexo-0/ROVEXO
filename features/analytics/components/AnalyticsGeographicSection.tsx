"use client";

import { useMemo, useState } from "react";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatAnalyticsCurrency } from "@/lib/analytics/utils";
import type { AnalyticsGeographicCountry } from "@/lib/analytics/types";

type AnalyticsGeographicSectionProps = {
  countries: AnalyticsGeographicCountry[];
};

/** One Product — geographic sales as Master Menu rows (no map dashboard card). */
export function AnalyticsGeographicSection({ countries }: AnalyticsGeographicSectionProps) {
  const [selectedId, setSelectedId] = useState(countries[0]?.id ?? "");
  const selected = useMemo(
    () => countries.find((country) => country.id === selectedId) ?? countries[0],
    [countries, selectedId],
  );

  return (
    <CanonicalSection title="Geographic Sales">
      <CanonicalCard variant="list">
        {countries.length === 0 ? (
          <CanonicalMenuRow title="No geographic data yet" showChevron={false} />
        ) : (
          countries.map((country) => (
            <CanonicalMenuRow
              key={country.id}
              title={country.name}
              description={
                country.id === selected?.id
                  ? `${country.orders.toLocaleString()} orders · selected`
                  : `${country.orders.toLocaleString()} orders`
              }
              value={formatAnalyticsCurrency(country.revenue)}
              showChevron={false}
              onClick={() => setSelectedId(country.id)}
            />
          ))
        )}
      </CanonicalCard>
    </CanonicalSection>
  );
}
