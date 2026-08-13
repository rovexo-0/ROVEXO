"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ShareNodesLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import {
  HOMEPAGE_SHARE,
  getHomepageFacebookShareUrl,
  getHomepageWhatsAppShareUrl,
  getHomepageXShareUrl,
  isCanonicalHomepageShareUrl,
} from "@/lib/share/homepage";

async function canUseNativeShare(): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare === "function") {
    try {
      return navigator.canShare({
        title: HOMEPAGE_SHARE.title,
        text: HOMEPAGE_SHARE.text,
        url: HOMEPAGE_SHARE.url,
      });
    } catch {
      return true;
    }
  }
  return true;
}

/**
 * Homepage header Share — Share Nodes icon ②.
 * Mobile: native Web Share API. Desktop: compact WhatsApp / Facebook / X / Copy link.
 * Menu closes on action / outside / Escape; leaving Homepage unmounts header chrome.
 */
export function HomepageHeaderShareButton({ className }: { className?: string }) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const showCopiedToast = useCallback(() => {
    setToast("Link copied");
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  const copyLink = useCallback(async () => {
    if (!isCanonicalHomepageShareUrl(HOMEPAGE_SHARE.url)) return;
    try {
      await navigator.clipboard.writeText(HOMEPAGE_SHARE.url);
      showCopiedToast();
    } catch {
      setToast("Unable to copy link");
      window.setTimeout(() => setToast(null), 2000);
    }
  }, [showCopiedToast]);

  const tryNativeShare = useCallback(async (): Promise<boolean> => {
    if (!(await canUseNativeShare())) return false;
    if (!isCanonicalHomepageShareUrl(HOMEPAGE_SHARE.url)) return false;
    try {
      await navigator.share({
        title: HOMEPAGE_SHARE.title,
        text: HOMEPAGE_SHARE.text,
        url: HOMEPAGE_SHARE.url,
      });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return true;
      }
      return false;
    }
  }, []);

  const onShareClick = useCallback(async () => {
    if (menuOpen) {
      closeMenu();
      return;
    }
    const shared = await tryNativeShare();
    if (!shared) setMenuOpen(true);
  }, [closeMenu, menuOpen, tryNativeShare]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        closeMenu();
      }
    };

    const onPageHide = () => closeMenu();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("popstate", onPageHide);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("popstate", onPageHide);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    rootRef.current
      ?.querySelector<HTMLElement>('[role="menu"] a, [role="menu"] button')
      ?.focus();
  }, [menuOpen]);

  const whatsAppHref = getHomepageWhatsAppShareUrl();
  const facebookHref = getHomepageFacebookShareUrl();
  const xHref = getHomepageXShareUrl();

  return (
    <div ref={rootRef} className={cn("rx-h2-share", className)}>
      <button
        type="button"
        aria-label="Share ROVEXO"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        onClick={() => void onShareClick()}
        className={cn(
          "rx-h2__action rx-h2__action--share",
          "active:scale-[0.94]",
          transitionFast,
          focusRing,
        )}
      >
        <span className="rx-h2__action-icon" aria-hidden>
          <ShareNodesLineIcon className="rx-h2__lucide h-5 w-5" />
        </span>
      </button>

      {menuOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Share ROVEXO"
          className="rx-h2-share__menu"
        >
          <a
            role="menuitem"
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("rx-h2-share__item", focusRing)}
            onClick={closeMenu}
          >
            WhatsApp
          </a>
          <a
            role="menuitem"
            href={facebookHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("rx-h2-share__item", focusRing)}
            onClick={closeMenu}
          >
            Facebook
          </a>
          <a
            role="menuitem"
            href={xHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("rx-h2-share__item", focusRing)}
            onClick={closeMenu}
          >
            X
          </a>
          <button
            type="button"
            role="menuitem"
            className={cn("rx-h2-share__item", focusRing)}
            onClick={() => {
              void copyLink().finally(closeMenu);
            }}
          >
            Copy link
          </button>
        </div>
      ) : null}

      {toast ? (
        <p role="status" aria-live="polite" className="rx-h2-share-toast">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
