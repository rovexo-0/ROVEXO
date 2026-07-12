"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  removePromotionChannel,
  subscribeToPromotionChanges,
} from "@/lib/promotions/realtime";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type PromotionRealtimeRefresherProps = {
  sellerId?: string;
};

/** Debounced router.refresh when promotion tables change (Supabase Realtime). */
export function PromotionRealtimeRefresher({ sellerId }: PromotionRealtimeRefresherProps) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;

    const channel = subscribeToPromotionChanges({
      sellerId,
      onChange: () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 500);
      },
    });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (channel) removePromotionChannel(channel);
    };
  }, [router, sellerId]);

  return null;
}
