import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import type { UserProfile } from "@/lib/profile/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const stubProfile = {
  id: "u1",
  email: "demo@rovexo.co.uk",
  fullName: "Demo",
  username: "demo",
  role: "buyer",
} as UserProfile;

describe("P0.4 Account instant navigation — reference parity", () => {
  it("enumerates canonical Account href destinations only", () => {
    const items = buildAccountMenuSections(stubProfile, { activeListingCount: 3 }).flatMap(
      (s) => s.items,
    );
    const hrefs = items
      .filter((i) => i.href)
      .map((i) => ({ id: i.id, href: i.href }));
    const promote = items.find((i) => i.id === "promote");

    expect(hrefs).toEqual(
      expect.arrayContaining([
        { id: "favourites", href: "/saved" },
        { id: "balance", href: "/wallet" },
        { id: "my-orders", href: "/orders" },
        { id: "settings", href: "/account/settings" },
        { id: "ideas", href: "/account/ideas" },
      ]),
    );
    expect(hrefs.find((h) => h.id === "promote")).toBeUndefined();
    expect(promote).toMatchObject({
      id: "promote",
      value: "Coming Soon",
      comingSoon: true,
    });
    expect(promote?.href).toBeUndefined();
    expect(hrefs.find((h) => h.id === "holiday-mode")).toBeUndefined();
    expect(hrefs.find((h) => h.id === "theme")).toBeUndefined();
  });

  it("reference destinations keep Account chrome loading shells", () => {
    expect(readSource("app/(platform)/wallet/loading.tsx")).toContain('title="Balance"');
    expect(readSource("app/(platform)/orders/loading.tsx")).toContain('title="Orders"');
    expect(readSource("app/(platform)/account/settings/loading.tsx")).toContain('title="Settings"');
  });

  it("Favourites / Promote / Ideas match reference loading chrome", () => {
    const saved = readSource("app/(platform)/saved/loading.tsx");
    const promote = readSource("app/(platform)/promote/loading.tsx");
    const ideas = readSource("app/(platform)/account/ideas/loading.tsx");

    expect(saved).toMatch(/import\s+\{\s*AccountCanonicalShell/);
    expect(saved).toContain('title="Saved"');
    expect(saved).not.toMatch(/import\s+.*BetaAppShell/);

    expect(promote).toMatch(/import\s+\{\s*AccountCanonicalShell/);
    expect(promote).toContain('title="Promote"');

    expect(ideas).toMatch(/import\s+\{\s*MyAccountTemplate/);
    expect(ideas).toContain('title="Rovexo Ideas"');
  });

  it("Promote uses light getAuthContext + parallel fetches (not heavy getProfile first)", () => {
    const page = readSource("app/(platform)/promote/page.tsx");
    expect(page).toMatch(/from\s+"@\/lib\/auth\/session"/);
    expect(page).toContain("getAuthContext");
    expect(page).toContain("Promise.all");
    expect(page).toContain("fetchSellerListings");
    expect(page).not.toMatch(/fetchProfile\s*\(/);
    expect(page).not.toMatch(/\bgetProfile\s*\(/);
  });

  it("Ideas shows skeleton while client feed loads", () => {
    const page = readSource("features/account-module/components/RovexoIdeasPage.tsx");
    const route = readSource("app/(platform)/account/ideas/page.tsx");
    expect(page).toContain("AccountModuleSkeleton");
    expect(page).toContain("{loading ?");
    expect(route).not.toMatch(/fallback=\{null\}/);
  });
});
