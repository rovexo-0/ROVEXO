"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import type { SearchNavItem } from "@/features/search/types";

export function useSearchKeyboard(items: SearchNavItem[], resetKey = "") {
  const [state, setState] = useState({ activeIndex: -1, resetKey: "" });
  const activeIndex = state.resetKey === resetKey ? state.activeIndex : -1;

  const setActiveIndex = useCallback(
    (index: number) => {
      setState({ activeIndex: index, resetKey });
    },
    [resetKey],
  );

  const activateItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;

      if (item.onSelect) {
        item.onSelect();
        return;
      }

      if (item.href) {
        window.location.href = item.href;
      }
    },
    [items],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (items.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((activeIndex + 1) % items.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
        return;
      }

      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        activateItem(activeIndex);
      }
    },
    [items, activeIndex, activateItem, setActiveIndex],
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    activateItem,
  };
}
