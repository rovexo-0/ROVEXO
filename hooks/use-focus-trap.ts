"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.closest("[inert]")) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

/**
 * P13.1 — reusable focus trap for dialogs / modals / drawers / sheets.
 * - Focuses first focusable (or container) on open
 * - Cycles Tab / Shift+Tab inside the container
 * - Restores focus to the previously focused element on close
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
): void {
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const previous = document.activeElement;
    restoreRef.current =
      previous instanceof HTMLElement ? previous : null;

    const root = containerRef.current;
    if (!root) return;

    const focusables = getFocusableElements(root);
    const initial = focusables[0] ?? root;
    if (!initial.hasAttribute("tabindex") && initial === root) {
      root.tabIndex = -1;
    }
    // Defer to allow dialog mount paint.
    const focusTimer = window.setTimeout(() => {
      initial.focus({ preventScroll: true });
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const nodes = getFocusableElements(root);
      if (nodes.length === 0) {
        event.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (event.shiftKey) {
        if (document.activeElement === first || document.activeElement === root) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
        return;
      }
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      root.removeEventListener("keydown", onKeyDown);
      const restore = restoreRef.current;
      if (restore && document.contains(restore)) {
        restore.focus({ preventScroll: true });
      }
      restoreRef.current = null;
    };
  }, [active, containerRef]);
}
