"use client";

import { useCallback, useMemo, useState } from "react";
import type { SearchOverlayContextValue } from "@/features/search/types";

export function useSearchOverlayState(isSeller: boolean): {
  isOpen: boolean;
  initialQuery: string;
  open: (query?: string) => void;
  close: () => void;
  value: SearchOverlayContextValue;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  const open = useCallback((query = "") => {
    setInitialQuery(query);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInitialQuery("");
  }, []);

  const value = useMemo(
    () => ({ open, close, isOpen, isSeller }),
    [open, close, isOpen, isSeller],
  );

  return { isOpen, initialQuery, open, close, value };
}
