"use client";

import { useCallback, useState } from "react";
import type { AnalyticsDateRange, SellerAnalyticsData } from "@/lib/analytics/types";

export function useAnalyticsData(type: "seller", initialData: SellerAnalyticsData) {
  const [range, setRange] = useState<AnalyticsDateRange>(initialData.range);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const changeRange = useCallback(
    async (nextRange: AnalyticsDateRange) => {
      if (nextRange === range) return;

      setLoading(true);
      setRange(nextRange);

      try {
        const response = await fetch(`/api/analytics?type=${type}&range=${nextRange}`);
        const payload = (await response.json()) as { data: SellerAnalyticsData };
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
