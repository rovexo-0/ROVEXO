import type { ReactNode } from "react";

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
