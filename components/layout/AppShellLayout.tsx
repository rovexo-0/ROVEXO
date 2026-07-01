"use client";

import type { ReactNode } from "react";
import { AppChromeScrollProvider } from "@/components/layout/AppChromeScrollProvider";

export function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppChromeScrollProvider>
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
    </AppChromeScrollProvider>
  );
}
