import { expect, type Page } from "@playwright/test";

/** Photos region — first file input when multiple pickers exist on the sell form. */
export function sellPhotoInput(page: Page) {
  return page.getByRole("region", { name: "Add Photos" }).locator('input[type="file"]').first();
}

export async function uploadSellPhoto(page: Page, filePath: string | string[]): Promise<void> {
  await sellPhotoInput(page).setInputFiles(filePath);
  await expect(page.locator('img[alt="Cover photo"]')).toBeVisible({ timeout: 15_000 });
}

export async function fillSellDescription(page: Page, description: string): Promise<void> {
  const field = page.getByPlaceholder(/tell buyers more about/i);
  await expect(field).toBeVisible({ timeout: 15_000 });
  await field.fill(description);
}

export async function publishSellListing(page: Page): Promise<void> {
  const publishBtn = page.getByRole("button", { name: /^publish listing$/i });
  await expect(publishBtn).toBeEnabled({ timeout: 60_000 });
  await publishBtn.click();
  await expect(page).toHaveURL(/\/listing\//, { timeout: 120_000 });
}
