/**
 * OPT-HP-PERF — Homepage CSS/JS load path (source locks only).
 * No UI redesign · no listing removal · no API/business changes.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("OPT-HP-PERF Homepage load path", () => {
  it("identifies five Homepage stylesheet owners", () => {
    const page = readSource("app/(platform)/page.tsx");
    const platform = readSource("app/(platform)/layout.tsx");
    const root = readSource("app/layout.tsx");
    expect(root).toContain('import "./globals.css"');
    expect(platform).toContain("@/styles/rovexo/index.css");
    expect(page).toContain("@/styles/homepage-canonical.css");
    expect(page).toContain("@/styles/homepage-canonical-responsive.css");
    expect(page).toContain("@/styles/rovexo/header-v2.css");
  });

  it("defers dark-theme CSS and unused platform sheets off Homepage critical path", () => {
    const index = readSource("styles/rovexo/index.css");
    expect(index).not.toContain('@import "./black-underground-theme-v1.css"');
    expect(index).not.toContain('@import "./forms.css"');
    expect(index).not.toContain('@import "./cards.css"');
    expect(index).not.toContain('@import "./header-premium.css"');
    expect(index).not.toContain('@import "./rovexo-header-standard-v1.css"');
    expect(existsSync(join(process.cwd(), "styles/rovexo/black-underground-theme-v1.css"))).toBe(
      true,
    );
    expect(readSource("components/providers/RovexoThemeProvider.tsx")).toContain(
      "loadBlackUndergroundThemeCss",
    );
    expect(readSource("components/ui/Input.tsx")).toContain("forms.css");
    expect(readSource("components/home/ProductGridSkeleton.tsx")).not.toContain("cards.css");
    expect(readSource("components/navigation/CanonicalPageHeader.tsx")).toContain(
      "rovexo-header-standard-v1.css",
    );
    expect(readSource("components/Header.tsx")).toContain("header-premium.css");
  });

  it("keeps above-fold Homepage CSS on the platform path", () => {
    const index = readSource("styles/rovexo/index.css");
    for (const sheet of [
      "listing-card-official.css",
      "store-listing-card-premium-v1.css",
      "category-rail.css",
      "bottom-nav-premium.css",
    ] as const) {
      expect(index).toContain(sheet);
    }
  });

  it("does not global-preconnect Supabase; createClient owns the hint", () => {
    const root = readSource("app/layout.tsx");
    expect(root).not.toContain("supabaseOrigin");
    expect(root).toContain("OPT-HP-PERF");
    expect(readSource("lib/supabase/client.ts")).toContain("ensureSupabasePreconnect");
    const realtimeProvider = readSource(
      "features/notifications/components/RealtimeNotificationProvider.tsx",
    );
    expect(realtimeProvider).toContain('import("@/lib/supabase/client")');
    expect(realtimeProvider).toContain('import("@/lib/notifications/realtime")');
    expect(realtimeProvider).not.toContain(
      'import { createClient } from "@/lib/supabase/client"',
    );
  });

  it("keeps i18n locale sync off the Supabase browser client", () => {
    const i18n = readSource("lib/i18n/provider.tsx");
    expect(i18n).not.toContain("@/lib/supabase/client");
    expect(i18n).toContain('fetch("/api/settings"');
  });

  it("scopes account CSS off platform megabundle; Account shell owns it", () => {
    const platform = readSource("styles/rovexo/platform-canonical-ui.css");
    expect(platform).not.toContain('@import "./account-canonical-v2.css"');
    expect(platform).not.toContain('@import "./account-settings-ui.css"');
    const index = readSource("styles/rovexo/index.css");
    expect(index).not.toContain('@import "./platform-canonical-ui.css"');
    expect(index).not.toContain('@import "./canonical-ds.css"');
    expect(index).not.toContain('@import "./universal-ui-v1.css"');
    expect(index).not.toContain('@import "./primary-button-v1.css"');
    expect(readSource("features/account-canonical/shell/AccountCanonicalShell.tsx")).toContain(
      "account-canonical-v2.css",
    );
    expect(readSource("features/account-canonical/shell/AccountCanonicalShell.tsx")).toContain(
      "canonical-ds.css",
    );
  });

  it("defers registered-user realtime Supabase until idle dynamic import", () => {
    const counter = readSource("components/header/HomepageRegisteredUserCounter.tsx");
    expect(counter).toContain('import("@/lib/platform/subscribe-registered-user-count-v1")');
    expect(counter).not.toContain(
      'from "@/lib/platform/subscribe-registered-user-count-v1"',
    );
    const subscribe = readSource("lib/platform/subscribe-registered-user-count-v1.ts");
    expect(subscribe).toContain('import("@/lib/supabase/client")');
    expect(subscribe).not.toContain('from "@/lib/supabase/client"');
  });

  it("applies CSP upgrade only on non-loopback hosts (localhost Lighthouse SSL fix)", () => {
    const middleware = readSource("middleware.ts");
    expect(middleware).toContain("PRODUCTION_CSP_LOOPBACK");
    expect(middleware).toContain("isLoopbackHost");
    expect(middleware).toContain("HSTS_PRODUCTION_VALUE");
    expect(readSource("next.config.ts")).toContain("buildNextConfigSecurityHeaders");
    expect(readSource("lib/ops/security-headers.ts")).toContain("buildNextConfigSecurityHeaders");
    expect(readSource("lib/ops/security-headers.ts")).toContain("PRODUCTION_CSP_LOOPBACK");
  });

  it("keeps ListingCard LCP discoverable (priority path unchanged)", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain("priority={priority}");
    expect(card).toContain('loading={priority ? undefined : "lazy"}');
    expect(readSource("components/homepage/canonical/CanonicalHomepage.tsx")).toContain(
      "lcpImagePriority",
    );
  });
});
