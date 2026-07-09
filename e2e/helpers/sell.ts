import { expect, type Page } from "@playwright/test";

/** Photos region — first file input when multiple pickers exist on the sell form. */
export function sellPhotoInput(page: Page) {
  return page.getByRole("region", { name: "Photos" }).locator('input[type="file"]').first();
}

export async function uploadSellPhoto(page: Page, filePath: string | string[]): Promise<void> {
  await sellPhotoInput(page).setInputFiles(filePath);
  await expect(page.locator('img[alt="Main photo"]')).toBeVisible({ timeout: 15_000 });
}

export async function fillSellDescription(page: Page, description: string): Promise<void> {
  const field = page.getByPlaceholder(/tell buyers more about/i);
  await expect(field).toBeVisible({ timeout: 15_000 });
  await field.fill(description);
}

export async function publishSellListing(page: Page): Promise<void> {
  const continueBtn = page.getByRole("button", { name: /^continue$/i });
  const publishBtn = page.getByRole("button", { name: /^publish$/i });

  if (await continueBtn.isVisible().catch(() => false)) {
    await expect(continueBtn).toBeEnabled({ timeout: 15_000 });
    await continueBtn.click();
  } else {
    await expect(publishBtn).toBeEnabled({ timeout: 15_000 });
    await publishBtn.click();
  }

  await expect(page.getByText(/published successfully/i).first()).toBeVisible({ timeout: 120_000 });
}
