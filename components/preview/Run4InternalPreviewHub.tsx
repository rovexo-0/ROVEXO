"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  disableRun4InternalPreview,
  enableRun4InternalPreview,
} from "@/components/preview/Run4InternalPadGate";
import type { Run4InternalPad } from "@/lib/preview/run4-internal-pad-css";

const PAGES = [
  { href: "/balance", label: "Wallet / Balance" },
  { href: "/orders", label: "Orders" },
  { href: "/inbox", label: "Inbox" },
  { href: "/saved", label: "Saved" },
  { href: "/sell", label: "Sell" },
  { href: "/search", label: "Search" },
  { href: "/account", label: "Profile" },
  { href: "/account/settings", label: "Settings" },
  { href: "/help", label: "Help" },
  { href: "/legal", label: "Legal" },
  { href: "/checkout", label: "Checkout" },
  { href: "/admin", label: "Admin" },
  { href: "/super-admin", label: "Super Admin" },
];

type Props = {
  pad: Run4InternalPad;
  mode: "enter" | "exit";
};

export function Run4InternalPreviewHub({ pad, mode }: Props) {
  useEffect(() => {
    if (mode === "exit") {
      disableRun4InternalPreview();
      return;
    }
    enableRun4InternalPreview(pad);
  }, [pad, mode]);

  if (mode === "exit") {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22 }}>RUN #4 internal preview exited</h1>
        <p style={{ color: "#52525b" }}>
          Temporary Internal UI overlay cleared. Homepage untouched. Master Full Width SSOT remains{" "}
          <strong>24px</strong> until Owner approval.
        </p>
        <Link href="/account">Open Profile</Link>
      </main>
    );
  }

  return (
    <main
      data-run4-preview-hub="temporary"
      style={{
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 560,
        margin: "0 auto",
        paddingBottom: 120,
      }}
    >
      <p style={{ color: "#9333ea", fontWeight: 700, margin: 0 }}>
        RUN #4 · INTERNAL UI v1.1 · TEMPORARY · LOCALHOST
      </p>
      <h1 style={{ fontSize: 24, margin: "8px 0" }}>Internal pad · {pad}px</h1>
      <p style={{ color: "#52525b", lineHeight: 1.45 }}>
        Applies <strong>only</strong> to internal application pages.{" "}
        <strong>Homepage is LOCKED</strong> and never overridden. Floating toggle: 24px ⇄ 16px.
        Master Design System SSOT is not updated until Owner approval.
      </p>

      <div style={{ display: "flex", gap: 8, margin: "16px 0 24px" }}>
        <Link
          href="/preview/ui-internal-24px"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "14px 12px",
            borderRadius: 16,
            background: pad === 24 ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "#f4f4f5",
            color: pad === 24 ? "#fff" : "#111",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Before 24px
        </Link>
        <Link
          href="/preview/ui-internal-16px"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "14px 12px",
            borderRadius: 16,
            background: pad === 16 ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "#f4f4f5",
            color: pad === 16 ? "#fff" : "#111",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          After 16px
        </Link>
      </div>

      <p style={{ fontSize: 13, color: "#b45309", background: "#fffbeb", padding: 12, borderRadius: 12 }}>
        Homepage (/) stays canonical marketing. Opening Homepage while preview is on shows “Homepage
        LOCKED” — no pad change.
      </p>

      <h2 style={{ fontSize: 16, marginTop: 28 }}>Internal pages ({pad}px)</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {PAGES.map((p) => (
          <li key={p.href} style={{ borderBottom: "1px solid #eee" }}>
            <Link
              href={p.href}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px 0",
                color: "#111",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <span>{p.label}</span>
              <span style={{ color: "#a1a1aa" }}>›</span>
            </Link>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 24 }}>
        <Link href="/preview/exit-internal" style={{ color: "#dc2626", fontWeight: 600 }}>
          Exit internal preview
        </Link>
      </p>
    </main>
  );
}
