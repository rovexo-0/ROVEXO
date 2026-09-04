import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Business Reviews — canonical Review Center", () => {
  it("reuses the existing seller Review Center, not a second engine", () => {
    const page = src("app/(platform)/business/reviews/page.tsx");
    const api = src("app/api/seller/review-center/route.ts");
    expect(page).toContain("SellerReviewCenterPage");
    expect(page).toContain('surface="business"');
    expect(page).toContain('backHref="/business/menu"');
    expect(page).toContain("/business/inventory");
    expect(page).not.toContain("business_reviews");
    expect(page).not.toContain("business_review_cases");
    expect(api).toContain("listSellerReviewCases");
    expect(api).toContain("requireApiAuth");
    expect(api).not.toContain("requireApiRole");
    expect(src("lib/moderation/service.ts")).toContain('.eq("seller_id", sellerId)');
  });

  it("does not 403 unified buyer-role accounts on the canonical list API", () => {
    const api = src("app/api/seller/review-center/route.ts");
    const access = src("lib/moderation/seller-review-center-access-v1.ts");
    expect(api).not.toContain('requireApiRole(["seller", "business", "admin"])');
    expect(access).toContain('surface !== "business"');
    expect(access).toContain("activeSellerContext");
    expect(access).toContain("stripe.verified");
    expect(src("app/api/seller/review-center/[id]/route.ts")).not.toContain("requireApiRole");
    expect(src("app/api/seller/review-center/[id]/respond/route.ts")).not.toContain(
      "requireApiRole",
    );
  });

  it("gates the Business surface by Stripe + seller_context on the server", () => {
    const page = src("app/(platform)/business/reviews/page.tsx");
    const casePage = src("app/(platform)/business/reviews/[id]/page.tsx");
    expect(page).toContain("loadPwaBusinessSession");
    expect(page).toContain('status.activeSellerContext !== "business"');
    expect(page).toContain("status.stripe.verified");
    expect(casePage).toContain('surface="business"');
    expect(casePage).toContain('backHref="/business/reviews"');
    // Reviews engine retained; removed from user-facing Business menu navigation.
    expect(src("lib/business/pwa-business-menu-v1.ts")).not.toContain(
      'href: "/business/reviews"',
    );
  });

  it("distinguishes empty success from a real load failure and refreshes on return", () => {
    const list = src("features/seller/review-center/components/SellerReviewCenterPage.tsx");
    expect(list).toContain("No listings under review");
    expect(list).toContain("Unable to load review cases.");
    expect(list).toContain("if (!response.ok)");
    expect(list).toContain('fetch(endpoint');
    expect(list).toContain('cache: "no-store"');
    expect(list).toContain("inFlight.current");
    expect(list).toContain('addEventListener("pageshow"');
    expect(list).toContain('addEventListener("visibilitychange"');
    expect(list).not.toContain("setInterval");
    expect(src("features/seller/review-center/components/SellerReviewCasePage.tsx")).toContain(
      "canRespond",
    );
    expect(src("features/seller/review-center/components/SellerReviewCasePage.tsx")).toContain(
      "Submit explanation",
    );
    expect(src("features/seller/review-center/components/SellerReviewCasePage.tsx")).toContain(
      "/respond",
    );
  });

  it("leaves Individual Review Center on /seller/review-center", () => {
    const seller = src("app/(platform)/seller/review-center/page.tsx");
    expect(seller).toContain("<SellerReviewCenterPage />");
    expect(seller).toContain("if (!profile.isSeller) redirect(\"/seller\")");
    expect(seller).not.toContain('surface="business"');
  });
});
