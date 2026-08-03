import type { ReactNode } from "react";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="contents" data-universal-ui="v1.1" data-universal-ui-status="preview">
      {children}
    </div>
  );
}
