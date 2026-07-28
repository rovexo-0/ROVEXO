"use client";

import { useEffect } from "react";
import Link from "next/link";
import { enableRun3Preview, disableRun3Preview } from "@/components/preview/Run3PadPreviewGate";
import type { Run3PreviewPad } from "@/lib/preview/run3-pad-override-css";

const PAGES = [
  { href: "/", label: "Homepage" },
  { href: "/balance", label: "Wallet / Balance" },
  { href: "/orders", label: "Orders" },
  { href: "/inbox", label: "Inbox" },
  { href: "/account", label: "Profile" },
  { href: "/account/settings", label: "Settings" },
];

type Props = {
  pad: Run3PreviewPad;
  mode: "enter" | "exit";
};

export function Run3PreviewHub({ pad, mode }: Props) {
  useEffect(() => {
    if (mode === "exit") {
      disableRun3Preview();
      return;
    }
    enableRun3Preview(pad);
  }, [pad, mode]);

  if (mode === "exit") {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22 }}>RUN #3 preview exited</h1>
        <p style={{ color: "#52525b" }}>
          Temporary 24⇄12 overlay cleared. Canonical Design System remains <strong>24px</strong> SSOT.
        </p>
        <Link href="/">Back to Homepage</Link>
      </main>
    );
  }

  const other = pad === 24 ? 12 : 24;

  return (
    <main
      data-run3-preview-hub="temporary"
      style={{
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 520,
        margin: "0 auto",
        paddingBottom: 120,
      }}
    >
      <p style={{ color: "#9333ea", fontWeight: 700, margin: 0 }}>RUN #3 · TEMPORARY · LOCALHOST ONLY</p>
      <h1 style={{ fontSize: 24, margin: "8px 0" }}>UI Preview · {pad}px</h1>
      <p style={{ color: "#52525b", lineHeight: 1.45 }}>
        Horizontal page padding override only. Master Full Width SSOT stays 24px until Owner approval.
        Use the floating <strong>24px ⇄ 12px</strong> toggle on any page, or switch entry routes.
      </p>

      <div style={{ display: "flex", gap: 8, margin: "16px 0 24px" }}>
        <Link
          href="/preview/ui-24px"
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
          24px
        </Link>
        <Link
          href="/preview/ui-12px"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "14px 12px",
            borderRadius: 16,
            background: pad === 12 ? "linear-gradient(135deg,#a855f7,#7c3aed)" : "#f4f4f5",
            color: pad === 12 ? "#fff" : "#111",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          12px
        </Link>
      </div>

      <p style={{ fontSize: 13, color: "#71717a" }}>
        Also: <Link href={`/preview/ui-${other}px`}>Switch to {other}px entry</Link>
      </p>

      <h2 style={{ fontSize: 16, marginTop: 28 }}>Open pages with {pad}px active</h2>
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
        <Link href="/preview/exit" style={{ color: "#dc2626", fontWeight: 600 }}>
          Exit preview mode
        </Link>
      </p>
    </main>
  );
}
