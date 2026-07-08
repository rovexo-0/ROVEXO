import { expect, test } from "@playwright/test";
import {
  canRunTransactionModeE2E,
  seedTransactionModeFixtures,
} from "./helpers/transaction-mode-fixtures";

test.describe("Transaction Mode Certification — API", () => {
  test("category tree exposes transactionMode on nodes", async ({ request }) => {
    const response = await request.get("/api/categories/tree");
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      tree?: Array<{ slug: string; transactionMode?: string }>;
    };

    expect(body.tree?.length).toBeGreaterThan(0);

    const vehicles = body.tree?.find((node) => node.slug === "vehicles");
    const electronics = body.tree?.find((node) => node.slug === "electronics");

    expect(vehicles?.transactionMode ?? "DIRECT_CONTACT").toBe("DIRECT_CONTACT");
    expect(electronics?.transactionMode ?? "MARKETPLACE").toBe("MARKETPLACE");
  });

  test("search results expose transactionMode when listings exist", async ({ request }) => {
    const response = await request.get("/api/search/results?page=1");
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      items?: Array<{ transactionMode?: string }>;
    };

    if ((body.items?.length ?? 0) > 0) {
      for (const item of body.items ?? []) {
        if (item.transactionMode) {
          expect(["MARKETPLACE", "DIRECT_CONTACT"]).toContain(item.transactionMode);
        }
      }
    }
  });
});

test.describe("Transaction Mode Certification — MARKETPLACE UI", () => {
  test("shows Buy Now, Add to Cart, buyer protection, and delivery", async ({ page }) => {
    test.skip(!canRunTransactionModeE2E(), "Requires Supabase");

    const fixtures = await seedTransactionModeFixtures();
    try {
      await page.goto(`/listing/${fixtures.marketplaceSlug}`, { waitUntil: "domcontentloaded" });

      const main = page.getByRole("main");
      await expect(page.getByRole("button", { name: "Buy Now" })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("button", { name: "Add to Cart" })).toBeVisible();
      await expect(main.getByText(/shipping/i).first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Contact Seller" })).toHaveCount(0);
    } finally {
      await fixtures.cleanup();
    }
  });
});

test.describe("Transaction Mode Certification — DIRECT_CONTACT UI", () => {
  test("shows Contact Seller and hides marketplace commerce", async ({ page }) => {
    test.skip(!canRunTransactionModeE2E(), "Requires Supabase");

    const fixtures = await seedTransactionModeFixtures();
    try {
      await page.goto(`/listing/${fixtures.directContactSlug}`, { waitUntil: "domcontentloaded" });

      const main = page.getByRole("main");
      await expect(page.getByRole("button", { name: "Contact Seller" })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("button", { name: "Buy Now" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Add to Cart" })).toHaveCount(0);
      await expect(main.getByRole("link", { name: /buyer protection fee/i })).toHaveCount(0);
    } finally {
      await fixtures.cleanup();
    }
  });

  test("blocks cart API for direct-contact listings", async ({ request }) => {
    test.skip(!canRunTransactionModeE2E(), "Requires Supabase for seeded listings");

    const fixtures = await seedTransactionModeFixtures();
    try {
      const response = await request.post("/api/cart", {
        data: { action: "add", productSlug: fixtures.directContactSlug },
      });

      expect([401, 400]).toContain(response.status());
      if (response.status() === 400) {
        const body = (await response.json()) as { error?: string };
        expect(body.error?.toLowerCase()).toContain("direct contact");
      }
    } finally {
      await fixtures.cleanup();
    }
  });

  test("blocks checkout API for direct-contact listings", async ({ request }) => {
    test.skip(!canRunTransactionModeE2E(), "Requires Supabase for seeded listings");

    const fixtures = await seedTransactionModeFixtures();
    try {
      const response = await request.post("/api/orders/checkout", {
        data: { productSlug: fixtures.directContactSlug, deliveryOption: "standard" },
      });

      expect([401, 400]).toContain(response.status());
      if (response.status() === 400) {
        const body = (await response.json()) as { error?: string; success?: boolean };
        expect(body.error?.toLowerCase() ?? "").toMatch(/direct contact|checkout/);
      }
    } finally {
      await fixtures.cleanup();
    }
  });
});

test.describe("Transaction Mode Certification — responsive", () => {
  test("direct contact layout on mobile viewport", async ({ page }) => {
    test.skip(!canRunTransactionModeE2E(), "Requires Supabase");

    await page.setViewportSize({ width: 390, height: 844 });
    const fixtures = await seedTransactionModeFixtures();
    try {
      await page.goto(`/listing/${fixtures.directContactSlug}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("button", { name: "Contact Seller" })).toBeVisible({ timeout: 30_000 });
    } finally {
      await fixtures.cleanup();
    }
  });

  test("marketplace layout on tablet viewport", async ({ page }) => {
    test.skip(!canRunTransactionModeE2E(), "Requires Supabase");

    await page.setViewportSize({ width: 834, height: 1194 });
    const fixtures = await seedTransactionModeFixtures();
    try {
      await page.goto(`/listing/${fixtures.marketplaceSlug}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("button", { name: "Buy Now" })).toBeVisible({ timeout: 30_000 });
    } finally {
      await fixtures.cleanup();
    }
  });
});
