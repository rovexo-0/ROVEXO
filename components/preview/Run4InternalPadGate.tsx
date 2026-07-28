"use client";

/**
 * RUN #4 TEMPORARY — Internal UI v1.1 (16px) localhost preview.
 * Homepage LOCKED: never applies on `/`.
 * Does not modify Master Full Width SSOT.
 */
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  RUN4_DATA_ATTR,
  RUN4_STORAGE_ACTIVE,
  RUN4_STORAGE_PAD,
  isRun4HomepagePath,
  isRun4LocalHost,
  run4InternalPadOverrideCss,
  type Run4InternalPad,
} from "@/lib/preview/run4-internal-pad-css";
import { RUN3_STORAGE_ACTIVE } from "@/lib/preview/run3-pad-override-css";

const STYLE_ID = "rovexo-run4-internal-pad-override";

function readPad(): Run4InternalPad {
  try {
    return localStorage.getItem(RUN4_STORAGE_PAD) === "16" ? 16 : 24;
  } catch {
    return 24;
  }
}

function readActive(): boolean {
  try {
    return localStorage.getItem(RUN4_STORAGE_ACTIVE) === "1";
  } catch {
    return false;
  }
}

function clearDom() {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute(RUN4_DATA_ATTR);
  document.getElementById(STYLE_ID)?.remove();
}

function applyDom(pad: Run4InternalPad, active: boolean, homepage: boolean) {
  if (typeof document === "undefined") return;
  if (!active || homepage) {
    clearDom();
    return;
  }
  const html = document.documentElement;
  html.setAttribute(RUN4_DATA_ATTR, String(pad));
  const css = run4InternalPadOverrideCss(pad);
  const existing = document.getElementById(STYLE_ID);
  if (existing) {
    existing.textContent = css;
  } else {
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export function Run4InternalPadGate() {
  const pathname = usePathname() ?? "/";
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [active, setActive] = useState(false);
  const [pad, setPad] = useState<Run4InternalPad>(24);
  const homepage = isRun4HomepagePath(pathname);

  useEffect(() => {
    const hostOk = isRun4LocalHost(window.location.hostname);
    if (!hostOk) {
      void Promise.resolve().then(() => {
        setAllowed(false);
        setReady(true);
      });
      return;
    }
    const a = readActive();
    const p = readPad();
    applyDom(p, a, isRun4HomepagePath(window.location.pathname));

    void Promise.resolve().then(() => {
      setAllowed(true);
      setActive(a);
      setPad(p);
      setReady(true);
    });

    const onStorage = () => {
      const nextA = readActive();
      const nextP = readPad();
      setActive(nextA);
      setPad(nextP);
      applyDom(nextP, nextA, isRun4HomepagePath(window.location.pathname));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready || !allowed) return;
    applyDom(pad, active, homepage);
  }, [pathname, homepage, pad, active, ready, allowed]);

  const setPreview = useCallback(
    (nextPad: Run4InternalPad, nextActive = true) => {
      try {
        // Avoid fighting RUN #3 overlay
        localStorage.setItem(RUN3_STORAGE_ACTIVE, "0");
        localStorage.setItem(RUN4_STORAGE_ACTIVE, nextActive ? "1" : "0");
        localStorage.setItem(RUN4_STORAGE_PAD, String(nextPad));
      } catch {
        /* ignore */
      }
      setActive(nextActive);
      setPad(nextPad);
      applyDom(nextPad, nextActive, isRun4HomepagePath(window.location.pathname));
    },
    [],
  );

  if (!ready || !allowed || !active) return null;

  return (
    <div
      data-run4-preview-chrome="temporary"
      style={{
        position: "fixed",
        zIndex: 2147483000,
        left: 12,
        right: 12,
        bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 999,
          background: "rgba(17,17,17,0.92)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
          maxWidth: "100%",
        }}
      >
        <span style={{ opacity: 0.8 }}>RUN4 Internal</span>
        {homepage ? (
          <span style={{ color: "#fbbf24" }}>Homepage LOCKED · no pad override</span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPreview(24)}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 700,
                cursor: "pointer",
                background: pad === 24 ? "#9333ea" : "#3f3f46",
                color: "#fff",
              }}
            >
              24px
            </button>
            <button
              type="button"
              onClick={() => setPreview(16)}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 700,
                cursor: "pointer",
                background: pad === 16 ? "#9333ea" : "#3f3f46",
                color: "#fff",
              }}
            >
              16px
            </button>
          </>
        )}
        <a
          href="/preview/exit-internal"
          style={{ color: "#fca5a5", textDecoration: "none", padding: "0 6px" }}
        >
          Exit
        </a>
      </div>
    </div>
  );
}

export function enableRun4InternalPreview(pad: Run4InternalPad) {
  try {
    localStorage.setItem(RUN3_STORAGE_ACTIVE, "0");
    localStorage.setItem(RUN4_STORAGE_ACTIVE, "1");
    localStorage.setItem(RUN4_STORAGE_PAD, String(pad));
  } catch {
    /* ignore */
  }
  applyDom(pad, true, isRun4HomepagePath(window.location.pathname));
}

export function disableRun4InternalPreview() {
  try {
    localStorage.setItem(RUN4_STORAGE_ACTIVE, "0");
  } catch {
    /* ignore */
  }
  clearDom();
}
