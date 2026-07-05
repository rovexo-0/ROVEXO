"use client";

/**
 * Unified mobile header scroll context — re-exports the Rovexo provider so every
 * shell consumer (Header, BottomNavigation, AppShellLayout) shares one instance.
 */
export {
  RovexoMobileHeaderScrollProvider as MobileHeaderScrollProvider,
  useRovexoMobileHeaderScrollContext as useMobileHeaderScrollContext,
} from "@/components/home/RovexoMobileHeaderScrollContext";
