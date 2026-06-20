"use client";

import type { ReactNode } from "react";
import { MobileHeaderScrollProvider } from "@/components/home/MobileHeaderScrollContext";

type HomePageShellProps = {
  header: ReactNode;
  children: ReactNode;
  bottomNav: ReactNode;
};

export function HomePageShell({ header, children, bottomNav }: HomePageShellProps) {
  return (
    <MobileHeaderScrollProvider>
      {header}
      {children}
      {bottomNav}
    </MobileHeaderScrollProvider>
  );
}
