"use client";

import { useCallback, useRef, useState } from "react";
import {
  londonDateKey,
  type BusinessAnalyticsPeriodId,
} from "@/lib/analytics/business-analytics-v1";
import type { BusinessAnalyticsData } from "@/lib/analytics/types";

export function useBusinessAnalyticsV1(initialData: BusinessAnalyticsData) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const lastCustom = useRef({
    from: londonDateKey(new Date(initialData.rangeStart)),
    to: londonDateKey(new Date(initialData.rangeEnd)),
  });

  const changePeriod = useCallback(
    async (
      period: BusinessAnalyticsPeriodId,
      custom?: { from?: string | null; to?: string | null },
    ) => {
      if (period === data.period && period !== "custom") {
        return;
      }
      if (
        period === "custom" &&
        data.period === "custom" &&
        custom?.from === lastCustom.current.from &&
        custom?.to === lastCustom.current.to
      ) {
        return;
      }

      const id = requestId.current + 1;
      requestId.current = id;
      setLoading(true);

      const params = new URLSearchParams({ type: "business", period });
      if (period === "custom") {
        if (custom?.from) params.set("from", custom.from);
        if (custom?.to) params.set("to", custom.to);
      }

      try {
        const response = await fetch(`/api/analytics?${params.toString()}`);
        if (!response.ok) return;
        const payload = (await response.json()) as { data: BusinessAnalyticsData };
        if (requestId.current !== id) return;
        if (period === "custom") {
          lastCustom.current = {
            from: custom?.from ?? lastCustom.current.from,
            to: custom?.to ?? lastCustom.current.to,
          };
        }
        setData(payload.data);
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    },
    [data.period],
  );

  return { data, loading, changePeriod };
}
