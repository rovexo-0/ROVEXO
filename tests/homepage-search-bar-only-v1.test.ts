import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HOMEPAGE_SEARCH_BAR_ONLY_V1,
  isHomepageSearchBarRoute,
} from "@/lib/header/homepage-search-bar-only-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Homepage Search Bar Only v1.0 — OWNER PERMANENT FREEZE", () => {
  it("locks Owner permanent freeze", () => {
    expect(HOMEPAGE_SEARCH_BAR_ONLY_V1.status).toBe("OWNER_APPROVED_PERMANENT_FREEZE");
    expect(HOMEPAGE_SEARCH_BAR_ONLY_V1.approvedByOwner).toBe(true);
    expect(HOMEPAGE_SEARCH_BAR_ONLY_V1.freezeLocked).toBe(true);
    expect(HOMEPAGE_SEARCH_BAR_ONLY_V1.mustBe).toBe("UNMOUNTED");
    expect(HOMEPAGE_SEARCH_BAR_ONLY_V1.allowedRoutes).toEqual(["/"]);
    expect(HOMEPAGE_SEARCH_BAR_ONLY_V1.hideTricksForbidden).toContain("display:none");
    expect(HOMEPAGE_SEARCH_BAR_ONLY_V1.hideTricksForbidden).toContain("opacity:0");
  });

  it("allows mount only on Homepage", () => {
    expect(isHomepageSearchBarRoute("/")).toBe(true);
    expect(isHomepageSearchBarRoute("")).toBe(true);
    expect(isHomepageSearchBarRoute("/?ref=x")).toBe(true);
    expect(isHomepageSearchBarRoute("/inbox")).toBe(false);
    expect(isHomepageSearchBarRoute("/inbox?tab=notifications")).toBe(false);
    expect(isHomepageSearchBarRoute("/inbox/conversation/abc")).toBe(false);
    expect(isHomepageSearchBarRoute("/account")).toBe(false);
    expect(isHomepageSearchBarRoute("/account/settings")).toBe(false);
    expect(isHomepageSearchBarRoute("/wallet")).toBe(false);
    expect(isHomepageSearchBarRoute("/orders")).toBe(false);
    expect(isHomepageSearchBarRoute("/sell")).toBe(false);
    expect(isHomepageSearchBarRoute("/checkout")).toBe(false);
    expect(isHomepageSearchBarRoute("/saved")).toBe(false);
    expect(isHomepageSearchBarRoute("/search")).toBe(false);
    expect(isHomepageSearchBarRoute("/categories")).toBe(false);
    expect(isHomepageSearchBarRoute("/help")).toBe(false);
    expect(isHomepageSearchBarRoute("/super-admin")).toBe(false);
  });

  it("HeaderProvider mounts marketplace header only via homepage gate", () => {
    const provider = readSource("features/header/HeaderProvider.tsx");
    expect(provider).toContain("isHomepageSearchBarRoute");
    expect(provider).toContain("HOMEPAGE_SEARCH_BAR_ONLY_V1");
    expect(provider).toContain("mount: true");
    expect(provider).toContain("mount: false");
    expect(provider).not.toContain('className={cn(!chrome.visible && "hidden")}');
    expect(provider).not.toContain("visible: false");
    expect(provider).not.toContain("AUTH_PUBLIC_PREFIXES");
    expect(provider).not.toContain("ACCOUNT_SHELL_PREFIXES");
  });
});
