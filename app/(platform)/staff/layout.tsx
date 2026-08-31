import type { ReactNode } from "react";
/* OPT-HP-LCP-CSS: [data-universal-ui] rules — not on Canonical Homepage. */
import "@/styles/rovexo/universal-ui-v1.css";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen bg-background"
      data-universal-ui="v1.1"
      data-universal-ui-status="preview"
    >
      {children}
    </main>
  );
}
