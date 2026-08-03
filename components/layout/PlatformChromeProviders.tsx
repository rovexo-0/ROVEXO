"use client";

import type { ReactNode } from "react";
import { SearchProvider } from "@/features/search/components/SearchProvider";
import { HeaderProvider } from "@/features/header/HeaderProvider";

/**
 * RC7 — marketplace Search + Header chrome mounts only under `app/(platform)`.
 * Auth routes never hydrate these providers (login LCP isolation).
 * Singularity preserved: one SearchProvider + one HeaderProvider for the platform tree.
 */
export function PlatformChromeProviders({ children }: { children: ReactNode }) {
  return (
    <SearchProvider>
      <HeaderProvider>{children}</HeaderProvider>
    </SearchProvider>
  );
}
