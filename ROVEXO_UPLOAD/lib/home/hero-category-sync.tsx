"use client";

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RovexoCategoryPremiumKey } from "@/lib/home/category-premium-library";

type HeroCategorySyncContextValue = {
  previewCategoryKey: RovexoCategoryPremiumKey | null;
  setPreviewCategoryKey: (key: RovexoCategoryPremiumKey | null) => void;
  clearPreviewCategoryKey: () => void;
  isAutoplayPaused: boolean;
};

const HeroCategorySyncContext = createContext<HeroCategorySyncContextValue | null>(null);

export const HeroCategorySyncProvider = memo(function HeroCategorySyncProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [previewCategoryKey, setPreviewCategoryKeyState] =
    useState<RovexoCategoryPremiumKey | null>(null);

  const setPreviewCategoryKey = useCallback((key: RovexoCategoryPremiumKey | null) => {
    setPreviewCategoryKeyState(key);
  }, []);

  const clearPreviewCategoryKey = useCallback(() => {
    setPreviewCategoryKeyState(null);
  }, []);

  const value = useMemo<HeroCategorySyncContextValue>(
    () => ({
      previewCategoryKey,
      setPreviewCategoryKey,
      clearPreviewCategoryKey,
      isAutoplayPaused: previewCategoryKey !== null,
    }),
    [previewCategoryKey, setPreviewCategoryKey, clearPreviewCategoryKey],
  );

  return (
    <HeroCategorySyncContext.Provider value={value}>{children}</HeroCategorySyncContext.Provider>
  );
});

export function useHeroCategorySync(): HeroCategorySyncContextValue {
  const context = useContext(HeroCategorySyncContext);
  if (!context) {
    return {
      previewCategoryKey: null,
      setPreviewCategoryKey: () => {},
      clearPreviewCategoryKey: () => {},
      isAutoplayPaused: false,
    };
  }
  return context;
}
