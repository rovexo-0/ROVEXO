import { test, expect } from "@playwright/test";

test.describe("canonical commerce UI lock preview", () => {
  test("renders checkout, order details and tracking preview screens", async ({ page }) => {
    await page.goto("/ui-lock/commerce", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /checkout, order details/i })).toBeVisible();
    await expect(page.getByText("UI Lock v1.0")).toBeVisible();

    await expect(page.getByText("Screen 1 — Checkout")).toBeVisible();
    await expect(page.getByText("Screen 2 — Order Details")).toBeVisible();
    await expect(page.getByText("Screen 3 — Tracking")).toBeVisible();

    await expect(page.getByText("Platform Fee").first()).toBeVisible();
    await expect(page.getByText("Shipment from TechGear").first()).toBeVisible();
    await expect(page.getByText("Parcel 1 of 2").first()).toBeVisible();
    await expect(page.getByText("Products in this parcel").first()).toBeVisible();
  });
});
