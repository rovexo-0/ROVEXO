import type { ReactNode } from "react";
/* OPT-HP-LCP-CSS: [data-universal-ui] rules — not on Canonical Homepage. */
import "@/styles/rovexo/universal-ui-v1.css";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-universal-ui="v1.1" data-universal-ui-status="preview">
      {children}
    </div>
  );
}
