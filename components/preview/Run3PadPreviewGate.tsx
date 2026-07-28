"use client";

/**
 * RUN #3 TEMPORARY — localhost Design Review pad injector + floating toggle.
 * Never affects production hosts. Does not change Master Full Width SSOT.
 */
import { useCallback, useEffect, useState } from "react";
import {
  RUN3_DATA_ATTR,
  RUN3_STORAGE_ACTIVE,
  RUN3_STORAGE_PAD,
  isRun3LocalHost,
  run3PadOverrideCss,
  type Run3PreviewPad,
} from "@/lib/preview/run3-pad-override-css";

const STYLE_ID = "rovexo-run3-pad-override";

function readPad(): Run3PreviewPad {
  try {
    const v = localStorage.getItem(RUN3_STORAGE_PAD);
    return v === "12" ? 12 : 24;
  } catch {
    return 24;
  }
}

function readActive(): boolean {
  try {
    return localStorage.getItem(RUN3_STORAGE_ACTIVE) === "1";
  } catch {
    return false;
  }
}

function applyDom(pad: Run3PreviewPad, active: boolean) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const existing = document.getElementById(STYLE_ID);
  if (!active) {
    html.removeAttribute(RUN3_DATA_ATTR);
    existing?.remove();
    return;
  }
  html.setAttribute(RUN3_DATA_ATTR, String(pad));
  const css = run3PadOverrideCss(pad);
  if (existing) {
    existing.textContent = css;
  } else {
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export function Run3PadPreviewGate() {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [pad, setPad] = useState<Run3PreviewPad>(24);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const hostOk = isRun3LocalHost(window.location.hostname);
    if (!hostOk) {
      // Defer React state — effect body only schedules; no sync setState.
      void Promise.resolve().then(() => {
        setAllowed(false);
        setReady(true);
      });
      return;
    }
    const a = readActive();
    const p = readPad();
    applyDom(p, a);

    void Promise.resolve().then(() => {
      setAllowed(true);
      setActive(a);
      setPad(p);
      setReady(true);
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key !== RUN3_STORAGE_ACTIVE && e.key !== RUN3_STORAGE_PAD) return;
      const nextActive = readActive();
      const nextPad = readPad();
      setActive(nextActive);
      setPad(nextPad);
      applyDom(nextPad, nextActive);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setPreview = useCallback((nextPad: Run3PreviewPad, nextActive = true) => {
    try {
      localStorage.setItem(RUN3_STORAGE_ACTIVE, nextActive ? "1" : "0");
      localStorage.setItem(RUN3_STORAGE_PAD, String(nextPad));
    } catch {
      /* ignore */
    }
    setActive(nextActive);
    setPad(nextPad);
    applyDom(nextPad, nextActive);
  }, []);

  if (!ready || !allowed || !active) return null;

  return (
    <div
      data-run3-preview-chrome="temporary"
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
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 999,
          background: "rgba(17,17,17,0.92)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
          maxWidth: "100%",
        }}
      >
        <span style={{ opacity: 0.75, fontWeight: 500 }}>RUN3</span>
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
          onClick={() => setPreview(12)}
          style={{
            border: 0,
            borderRadius: 999,
            padding: "8px 12px",
            fontWeight: 700,
            cursor: "pointer",
            background: pad === 12 ? "#9333ea" : "#3f3f46",
            color: "#fff",
          }}
        >
          12px
        </button>
        <a
          href="/preview/exit"
          style={{ color: "#fca5a5", textDecoration: "none", padding: "0 6px", fontSize: 12 }}
        >
          Exit
        </a>
      </div>
    </div>
  );
}

/** Call from preview entry pages to enable mode before navigation. */
export function enableRun3Preview(pad: Run3PreviewPad) {
  try {
    localStorage.setItem(RUN3_STORAGE_ACTIVE, "1");
    localStorage.setItem(RUN3_STORAGE_PAD, String(pad));
  } catch {
    /* ignore */
  }
  applyDom(pad, true);
}

export function disableRun3Preview() {
  try {
    localStorage.setItem(RUN3_STORAGE_ACTIVE, "0");
  } catch {
    /* ignore */
  }
  applyDom(24, false);
}
