"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { ProductStatus } from "@/lib/supabase/types/database";
import "@/styles/rovexo/seller-listing-overflow-menu-v1.css";

export type SellerListingOverflowAction =
  | "edit"
  | "boost"
  | "pause"
  | "resume"
  | "duplicate"
  | "share"
  | "view"
  | "delete";

export type SellerListingOverflowMenuProps = {
  listingId: string;
  listingTitle: string;
  status: ProductStatus | string;
  busy?: boolean;
  onAction: (action: SellerListingOverflowAction) => void | Promise<void>;
  onClose: () => void;
};

type MenuRow = {
  id: SellerListingOverflowAction;
  label: string;
  danger?: boolean;
};

const MENU_MIN_WIDTH = 212;
const MENU_GAP_PX = 6;

function buildRows(status: string): MenuRow[] {
  // Active → Pause · Paused (or Sold) → Resume — existing status API only.
  const pauseOrResume: MenuRow =
    status === "paused" || status === "sold"
      ? { id: "resume", label: "Resume" }
      : { id: "pause", label: "Pause" };

  return [
    { id: "edit", label: "Edit" },
    { id: "boost", label: "Boost" },
    pauseOrResume,
    { id: "duplicate", label: "Duplicate" },
    { id: "share", label: "Share" },
    { id: "view", label: "View" },
    { id: "delete", label: "Delete", danger: true },
  ];
}

function anchorStyleFromTrigger(listingId: string, menuEl: HTMLElement | null): CSSProperties | null {
  const trigger = document.querySelector(
    `[data-listing-overflow-trigger="${listingId}"]`,
  );
  if (!(trigger instanceof HTMLElement)) return null;
  const rect = trigger.getBoundingClientRect();
  const width = Math.max(menuEl?.offsetWidth ?? 0, MENU_MIN_WIDTH);
  const left = Math.min(
    Math.max(8, rect.right - width),
    Math.max(8, window.innerWidth - width - 8),
  );
  return {
    top: rect.bottom + MENU_GAP_PX,
    left,
  };
}

/**
 * My Listings ••• popup only — lazy-friendly, memoized, ARIA menu.
 * Portaled to document.body so ancestor overflow:hidden cannot clip it.
 * Trigger button stays in the parent (UI lock).
 */
export const SellerListingOverflowMenu = memo(function SellerListingOverflowMenu({
  listingId,
  listingTitle,
  status,
  busy = false,
  onAction,
  onClose,
}: SellerListingOverflowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const rows = useMemo(() => buildRows(String(status)), [status]);
  const [mounted, setMounted] = useState(false);
  const [anchorStyle, setAnchorStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useFocusTrap(true, menuRef);

  const updateAnchor = useCallback(() => {
    setAnchorStyle(anchorStyleFromTrigger(listingId, menuRef.current));
  }, [listingId]);

  useLayoutEffect(() => {
    if (!mounted) return;
    updateAnchor();
    // Re-measure after first paint so width matches real menu content.
    const raf = window.requestAnimationFrame(() => updateAnchor());
    return () => window.cancelAnimationFrame(raf);
  }, [mounted, updateAnchor, rows]);

  useEffect(() => {
    if (!mounted) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(`[data-listing-overflow-trigger="${listingId}"]`)) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };
    const onScroll = () => onClose();
    const onPopState = () => onClose();
    const onResize = () => updateAnchor();

    window.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("resize", onResize);
    };
  }, [listingId, mounted, onClose, updateAnchor]);

  const handleItemKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])',
      );
      if (!buttons?.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        buttons[(index + 1) % buttons.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        buttons[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        buttons[buttons.length - 1]?.focus();
      }
    },
    [],
  );

  if (!mounted) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="ml-overflow-menu"
      role="menu"
      aria-labelledby={labelId}
      data-listing-overflow-menu={listingId}
      style={anchorStyle ?? { visibility: "hidden", top: 0, left: 0 }}
    >
      <span id={labelId} className="sr-only">
        Actions for {listingTitle}
      </span>
      {rows.map((row, index) => (
        <button
          key={row.id}
          type="button"
          role="menuitem"
          className={
            row.danger
              ? "ml-overflow-menu__item ml-overflow-menu__item--danger"
              : "ml-overflow-menu__item"
          }
          disabled={busy}
          onClick={() => void onAction(row.id)}
          onKeyDown={(event) => handleItemKeyDown(event, index)}
        >
          {row.label}
        </button>
      ))}
    </div>,
    document.body,
  );
});
