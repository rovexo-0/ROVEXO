"use client";

import { useEffect, useState } from "react";
import { useDocumentVisible } from "@/lib/performance/hooks";

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const visible = useDocumentVisible();

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay, visible]);

  return visible ? debouncedValue : value;
}
