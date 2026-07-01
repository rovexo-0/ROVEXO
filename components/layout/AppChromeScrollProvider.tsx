"use client";

import type { ReactNode } from "react";
import { RovexoMobileHeaderScrollProvider } from "@/components/home/RovexoMobileHeaderScrollContext";

export function AppChromeScrollProvider({ children }: { children: ReactNode }) {
  return <RovexoMobileHeaderScrollProvider>{children}</RovexoMobileHeaderScrollProvider>;
}

export { useRovexoMobileHeaderScrollContext as useAppChromeScroll } from "@/components/home/RovexoMobileHeaderScrollContext";
