"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const FROZEN_AUTH_PATHS = new Set([
  "/welcome",
  "/login",
  "/register",
  "/splash",
  "/forgot-password",
  "/reset-password",
]);

export function UniversalUiBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const frozenAuth = FROZEN_AUTH_PATHS.has(pathname);

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      data-universal-ui={frozenAuth ? undefined : "v1.1"}
      data-universal-ui-status={frozenAuth ? undefined : "preview"}
    >
      {children}
    </div>
  );
}
