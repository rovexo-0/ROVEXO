import { describe, expect, it } from "vitest";
import {
  HELP_CATEGORY_HUB_SLUGS,
  getHelpCategoryHub,
  listHelpCategoryHubs,
} from "@/lib/help/content/category-hubs-v1";
import { HELP_CENTRE_CATEGORY_BUTTONS } from "@/lib/help/help-centre-categories";
import { searchHelpCentre } from "@/lib/help/search";
import { MASTER_DOC_SECTIONS } from "@/lib/documentation/documentation-engine-v1";
import {
  getProhibitedRestrictedStats,
  PROHIBITED_RESTRICTED_CATEGORIES,
} from "@/lib/documentation/prohibited/build-prohibited-restricted-items-policy-v1";
import { getLegalDocument } from "@/lib/legal/canonical-documents";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ROVEXO Documentation Engine v1.0", () => {
  it("Help hubs follow the master documentation section order", () => {
    for (const hub of listHelpCategoryHubs()) {
      for (const section of MASTER_DOC_SECTIONS) {
        expect(hub.content, `${hub.slug} missing ${section}`).toContain(`## ${section}`);
      }
      expect(hub.content.length).toBeGreaterThan(2500);
    }
    expect(HELP_CATEGORY_HUB_SLUGS).toHaveLength(8);
    for (const button of HELP_CENTRE_CATEGORY_BUTTONS) {
      const slug = button.href.replace("/help/category/", "");
      expect(getHelpCategoryHub(slug)).toBeTruthy();
    }
  });

  it("states Seller Fee £0 and buyer-paid Platform Fee", () => {
    const seller = getHelpCategoryHub("seller");
    const buyer = getHelpCategoryHub("buyer");
    expect(seller?.content).toContain("Seller Fee = £0");
    expect(seller?.content).toMatch(/Platform Fee is paid by the buyer/i);
    expect(buyer?.content).toMatch(/Platform Fee is paid by the buyer/i);
  });

  it("Prohibited & Restricted Items is a compliance manual with classifications", () => {
    const stats = getProhibitedRestrictedStats();
    expect(stats.categories).toBeGreaterThanOrEqual(10);
    expect(stats.products).toBeGreaterThanOrEqual(100);
    expect(stats.faqs).toBeGreaterThanOrEqual(100);

    const doc = getLegalDocument("prohibited-restricted-items");
    expect(doc).toBeTruthy();
    expect(doc!.content.length).toBeGreaterThan(50_000);
    expect(doc!.content).toContain("**Classification:** Prohibited");
    expect(doc!.content).toContain("**Classification:** Restricted");
    expect(doc!.content).toContain("**Classification:** Allowed");
    expect(doc!.content).toContain("### Handguns");
    expect(doc!.content).toContain("### CBD");
    expect(doc!.content).toContain("### IMEI Blocked Devices");
    expect(doc!.content).toContain("Title Analysis");
    expect(doc!.content).toContain("Automatic Blocking");
    expect(doc!.content).toContain("Can I sell fireworks?");
    expect(doc!.content).toContain("Seller Fee");
    expect(doc!.content).toMatch(/Common questions/);
    expect(doc!.content).toMatch(/Related Documents/);

    for (const category of PROHIBITED_RESTRICTED_CATEGORIES) {
      expect(category.products.length).toBeGreaterThan(0);
      for (const product of category.products) {
        expect(["allowed", "restricted", "prohibited"]).toContain(product.classification);
      }
    }
  });

  it("search indexes hubs, FAQs, legal compliance manual, and synonyms", () => {
    expect(searchHelpCentre("Handguns", 20).some((r) => r.href.includes("prohibited-restricted-items"))).toBe(
      true,
    );
    expect(searchHelpCentre("Seller Fee £0", 20).some((r) => r.href.includes("/help/category/seller"))).toBe(
      true,
    );
    expect(
      searchHelpCentre("Who pays the Platform Fee", 20).some(
        (r) => r.type === "faq" || r.href.includes("/help/category/"),
      ),
    ).toBe(true);
    expect(
      searchHelpCentre("commission", 20).some(
        (r) => r.href.includes("/help/category/seller") || r.href.includes("/help/category/buyer"),
      ),
    ).toBe(true);
  });

  it("category route prefers hubs over placeholder decision trees", () => {
    const page = readFileSync(join(process.cwd(), "app/(platform)/help/category/[slug]/page.tsx"), "utf8");
    expect(page).toContain("HelpCategoryHubPage");
    expect(page).toContain("isHelpCategoryHubSlug");
  });
});
