import { describe, expect, it } from "vitest";
import {
  HELP_CATEGORY_HUB_SLUGS,
  getHelpCategoryHub,
  listHelpCategoryHubs,
} from "@/lib/help/content/category-hubs-v1";
import { HELP_CENTRE_CATEGORY_BUTTONS } from "@/lib/help/help-centre-categories";
import { searchHelpCentre } from "@/lib/help/search";
import { MASTER_DOC_SECTIONS } from "@/lib/documentation/documentation-engine-v1";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Help Centre category hubs v1.0", () => {
  it("covers every home Help category with a long-form hub", () => {
    expect(HELP_CATEGORY_HUB_SLUGS).toEqual([
      "buyer",
      "seller",
      "payments",
      "shipping",
      "orders",
      "account",
      "safety",
      "reports",
    ]);
    for (const button of HELP_CENTRE_CATEGORY_BUTTONS) {
      const slug = button.href.replace("/help/category/", "");
      expect(getHelpCategoryHub(slug), button.href).toBeTruthy();
    }
  });

  it("uses the master documentation structure on every hub", () => {
    for (const hub of listHelpCategoryHubs()) {
      for (const section of MASTER_DOC_SECTIONS) {
        expect(hub.content, `${hub.slug} missing ${section}`).toContain(`## ${section}`);
      }
      expect(hub.content.length).toBeGreaterThan(2500);
    }
  });

  it("states Seller Fee £0 and buyer-paid Platform Fee", () => {
    const seller = getHelpCategoryHub("seller");
    const buyer = getHelpCategoryHub("buyer");
    expect(seller?.content).toContain("Seller Fee = £0");
    expect(seller?.content).toMatch(/Platform Fee is paid by the buyer/i);
    expect(buyer?.content).toMatch(/Platform Fee is paid by the buyer/i);
  });

  it("indexes hubs in Help search (titles, body, keywords, legal)", () => {
    const sellerFee = searchHelpCentre("Seller Fee £0", 20);
    expect(sellerFee.some((row) => row.href.includes("/help/category/seller"))).toBe(true);
    const platformFee = searchHelpCentre("Platform Fee buyer", 20);
    expect(platformFee.some((row) => row.href.includes("/help/category/buyer"))).toBe(true);
    const legal = searchHelpCentre("platform fee policy", 20);
    expect(legal.some((row) => row.href.includes("/legal/platform-fee-policy"))).toBe(true);
    const faq = searchHelpCentre("Who pays the Platform Fee", 20);
    expect(faq.some((row) => row.type === "faq" && row.href.includes("/help/category/"))).toBe(true);
    const synonym = searchHelpCentre("commission", 20);
    expect(
      synonym.some(
        (row) => row.href.includes("/help/category/seller") || row.href.includes("/help/category/buyer"),
      ),
    ).toBe(true);
  });

  it("category route prefers hubs over placeholder decision trees", () => {
    const page = readFileSync(join(process.cwd(), "app/help/category/[slug]/page.tsx"), "utf8");
    expect(page).toContain("HelpCategoryHubPage");
    expect(page).toContain("isHelpCategoryHubSlug");
  });
});
