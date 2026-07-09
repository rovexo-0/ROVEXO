import type { ReactNode } from "react";
import { AppChromeScrollProvider } from "@/components/layout/AppChromeScrollProvider";
import { MobileScrollBootstrap } from "@/components/mobile/MobileScrollBootstrap";

export function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppChromeScrollProvider>
      <MobileScrollBootstrap />
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
    </AppChromeScrollProvider>
  );
}
