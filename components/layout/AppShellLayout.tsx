import type { ReactNode } from "react";
import { AppChromeScrollProvider } from "@/components/layout/AppChromeScrollProvider";
import { MobileScrollBootstrap } from "@/components/mobile/MobileScrollBootstrap";
import { NavigationPathRecorder } from "@/components/navigation/NavigationPathRecorder";
import { PromotionRealtimeRefresher } from "@/components/promotions/PromotionRealtimeRefresher";

export function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppChromeScrollProvider>
      <NavigationPathRecorder />
      <PromotionRealtimeRefresher />
      <MobileScrollBootstrap />
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
    </AppChromeScrollProvider>
  );
}
