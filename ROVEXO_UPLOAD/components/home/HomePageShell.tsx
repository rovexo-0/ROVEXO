"use client";

import type { ReactNode } from "react";

type HomePageShellProps = {
  header: ReactNode;
  children: ReactNode;
  bottomNav: ReactNode;
};

export function HomePageShell({ header, children, bottomNav }: HomePageShellProps) {
  return (
    <>
      {header}
      {children}
      {bottomNav}
    </>
  );
}
