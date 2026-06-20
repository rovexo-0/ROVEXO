"use client";

import { useCallback, useState } from "react";
import type {
  AnalyticsDateRange,
  BusinessAnalyticsData,
  SellerAnalyticsData,
} from "@/lib/analytics/types";

export function useAnalyticsData<T extends SellerAnalyticsData | BusinessAnalyticsData>(
  type: "seller" | "business",
  initialData: T,
) {
  const [range, setRange] = useState<AnalyticsDateRange>(initialData.range);
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);

  const changeRange = useCallback(
    async (nextRange: AnalyticsDateRange) => {
      if (nextRange === range) return;

      setLoading(true);
      setRange(nextRange);

      try {
        const response = await fetch(`/api/analytics?type=${type}&range=${nextRange}`);
        const payload = (await response.json()) as { data: T };
        setData(payload.data);
      } catch {
        setRange(range);
      } finally {
        setLoading(false);
      }
    },
    [range, type],
  );

  return { data, range, loading, changeRange };
}
