/**
 * Platform (non-auth) design-system CSS + marketplace chrome providers.
 * RC6/RC7 — login LCP isolation: auth routes never load this layout.
 */
import "@/styles/rovexo/index.css";
import { PlatformChromeProviders } from "@/components/layout/PlatformChromeProviders";

export default function PlatformGroupLayout({ children }: { children: React.ReactNode }) {
  return <PlatformChromeProviders>{children}</PlatformChromeProviders>;
}
