import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  formatRegisteredUserCount,
  isCanonicalDemoAccountEmail,
  isCountableRegisteredProfile,
  listCanonicalDemoExclusionEmails,
  REGISTERED_USER_COUNT_V1,
} from "@/lib/platform/registered-user-count-client-v1";
import { isProtectedDemoActor } from "@/lib/full-demo/security";
import { FULL_DEMO_ACCOUNTS } from "@/lib/full-demo/canonical";
import { DEMO_EMAIL_DOMAIN, DEMO_USERS } from "@/lib/demo-environment/config";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("COD SÂNGE — Homepage registered user counter (demo exclusion)", () => {
  it("A — real users are counted", () => {
    expect(
      isCountableRegisteredProfile({
        account_status: "active",
        deleted_at: null,
        email: "buyer@example.com",
      }),
    ).toBe(true);
  });

  it("B — Full Demo accounts are excluded via canonical marker", () => {
    for (const account of FULL_DEMO_ACCOUNTS) {
      expect(isCanonicalDemoAccountEmail(account.email)).toBe(true);
      expect(isProtectedDemoActor(account.email)).toBe(true);
      expect(
        isCountableRegisteredProfile({
          account_status: "active",
          deleted_at: null,
          email: account.email,
        }),
      ).toBe(false);
    }
  });

  it("C — DEMO_USERS / @demo.rovexo.co.uk test accounts are excluded", () => {
    for (const user of DEMO_USERS) {
      expect(isCanonicalDemoAccountEmail(user.email)).toBe(true);
      expect(
        isCountableRegisteredProfile({
          account_status: "active",
          deleted_at: null,
          email: user.email,
        }),
      ).toBe(false);
    }
    expect(isCanonicalDemoAccountEmail(`extra@${DEMO_EMAIL_DOMAIN}`)).toBe(true);
    expect(
      isCountableRegisteredProfile({
        account_status: "active",
        deleted_at: null,
        email: `extra@${DEMO_EMAIL_DOMAIN}`,
      }),
    ).toBe(false);
  });

  it("D — anonymous visitors are excluded (no profile / no count path)", () => {
    const server = read("lib/platform/registered-user-count-v1.ts");
    expect(server).toContain('.from("profiles")');
    expect(server).not.toContain("user_presence");
    expect(server).not.toContain("live_visitor");
    expect(server).not.toContain("page_view");
    expect(server).not.toContain("session");
  });

  it("E — one user cannot be counted twice (head count on profile id)", () => {
    const server = read("lib/platform/registered-user-count-v1.ts");
    expect(server).toContain('select("id", { count: "exact", head: true })');
    expect(REGISTERED_USER_COUNT_V1.canonicalTable).toBe("profiles");
  });

  it("F — compact formatting is correct", () => {
    expect(formatRegisteredUserCount(999)).toBe("999");
    expect(formatRegisteredUserCount(1000)).toBe("1K");
    expect(formatRegisteredUserCount(1250)).toBe("1.3K");
    expect(formatRegisteredUserCount(12482)).toBe("12.5K");
    expect(formatRegisteredUserCount(125000)).toBe("125K");
    expect(formatRegisteredUserCount(1_000_000)).toBe("1M");
  });

  it("G — fail closed when source unavailable (no fake numbers)", () => {
    const api = read("app/api/platform/registered-user-count/route.ts");
    const counter = read("components/header/HomepageRegisteredUserCounter.tsx");
    expect(api).toContain('error: "count_unavailable"');
    expect(api).toContain("503");
    expect(counter).toContain("if (count == null) return null");
    expect(counter).not.toContain("12.4K");
    expect(counter).not.toContain("10K");
    expect(counter).not.toContain("9999");
    expect(read("lib/platform/registered-user-count-v1.ts")).not.toContain("12.4K");
  });

  it("H/I/J — Homepage listing cards and images unchanged; no blur/filter", () => {
    const header = read("components/header/RovexoHeaderV2.tsx");
    expect(header).not.toContain("ListingCard");
    expect(header).not.toContain("filter:");
    expect(header).not.toContain("blur(");
    const listingCard = read("components/ui/ListingCard.tsx");
    expect(listingCard).not.toMatch(/registered-user-count|HomepageRegisteredUserCounter/);
  });

  it("K — no polling is introduced", () => {
    const counter = read("components/header/HomepageRegisteredUserCounter.tsx");
    const sub = read("lib/platform/subscribe-registered-user-count-v1.ts");
    expect(counter).not.toMatch(/setInterval/);
    expect(counter).not.toMatch(/setTimeout\(\s*load/);
    expect(counter).not.toMatch(/poll|everyHour|10\s*\*\s*60|24\s*\*\s*60/);
    expect(sub).toContain("postgres_changes");
  });

  it("L — existing Homepage header functionality preserved + counter only", () => {
    const header = read("components/header/RovexoHeaderV2.tsx");
    expect(header).toContain("HomepageSearchField");
    expect(header).toContain("HomepageRegisteredUserCounter");
    expect(header).toContain("OFFICIAL_BRAND_HEADER_DISPLAY_ASSET");
    expect(header).not.toContain("BellLineIcon");
    expect(header).not.toContain("HeaderProfileLink");
    expect(HEADER_MASTER_FREEZE_V1.homepageRegisteredUserCounter).toBe(true);
  });

  it("C2 — support+live-*@rovexo.co.uk E2E accounts are excluded from the counter", () => {
    const samples = [
      "support+live-buyer-iphone17metpn0@rovexo.co.uk",
      "support+live-seller-desktopmpom58@rovexo.co.uk",
      "SUPPORT+LIVE-BUYER-TEST@rovexo.co.uk",
    ];
    for (const email of samples) {
      expect(isCanonicalDemoAccountEmail(email)).toBe(true);
      expect(
        isCountableRegisteredProfile({
          account_status: "active",
          deleted_at: null,
          email,
        }),
      ).toBe(false);
    }
    /* Must not broaden beyond support+live-* */
    expect(isCanonicalDemoAccountEmail("support@rovexo.co.uk")).toBe(false);
    expect(isCanonicalDemoAccountEmail("live-buyer@rovexo.co.uk")).toBe(false);
    expect(isCanonicalDemoAccountEmail("palademihaita88@gmail.com")).toBe(false);
  });

  it("SQL path excludes demo domain + allowlist + support+live E2E pattern", () => {
    const server = read("lib/platform/registered-user-count-v1.ts");
    expect(server).toContain("listCanonicalDemoExclusionEmails");
    expect(server).toContain('not("email", "ilike"');
    expect(server).toContain('not("email", "in"');
    expect(server).toContain("supportLiveTestPattern");
    expect(REGISTERED_USER_COUNT_V1.demoMarker).toBe("isProtectedDemoActor");
    expect(REGISTERED_USER_COUNT_V1.demoEmailDomain).toBe(DEMO_EMAIL_DOMAIN);
    expect(REGISTERED_USER_COUNT_V1.supportLiveTestPattern).toBe("support+live-%@rovexo.co.uk");
    expect(REGISTERED_USER_COUNT_V1.version).toBe("v1.2");
    const emails = listCanonicalDemoExclusionEmails();
    expect(emails).toContain("demo.buyer@rovexo.co.uk");
    expect(emails).toContain("demo.seller@rovexo.co.uk");
    expect(emails.some((e) => e.endsWith(`@${DEMO_EMAIL_DOMAIN}`))).toBe(true);
  });

  it("does not invent profiles.is_demo — uses existing email-based demo marker", () => {
    const types = read("lib/supabase/types/database.ts");
    const profilesBlock = types.slice(
      types.indexOf("profiles: {"),
      types.indexOf("user_follows: {"),
    );
    expect(profilesBlock).not.toContain("is_demo");
    expect(isCanonicalDemoAccountEmail("real.user@gmail.com")).toBe(false);
    expect(
      isCountableRegisteredProfile({
        account_status: "active",
        deleted_at: null,
        email: "real.user@gmail.com",
      }),
    ).toBe(true);
  });

  it("deleted accounts remain excluded", () => {
    expect(
      isCountableRegisteredProfile({
        account_status: "deleted",
        deleted_at: null,
        email: "buyer@example.com",
      }),
    ).toBe(false);
    expect(
      isCountableRegisteredProfile({
        account_status: "active",
        deleted_at: "2026-08-10T00:00:00.000Z",
        email: "buyer@example.com",
      }),
    ).toBe(false);
  });
});
