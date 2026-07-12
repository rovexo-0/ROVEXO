import { expect, type Page } from "@playwright/test";

const SELL_DRAFT_STORAGE_KEY = "rovexo:sell-draft";
const SELL_UPLOAD_SESSION_KEY = "rovexo:sell-upload-session";

/** Clears persisted sell draft so async hydration cannot clobber an in-flight E2E form. */
export async function clearPersistedSellDraft(page: Page): Promise<void> {
  await page.evaluate(
    ([draftKey, sessionKey]) => {
      localStorage.removeItem(draftKey);
      localStorage.removeItem(sessionKey);
    },
    [SELL_DRAFT_STORAGE_KEY, SELL_UPLOAD_SESSION_KEY] as const,
  );
}

export async function gotoSellPage(page: Page): Promise<void> {
  await clearPersistedSellDraft(page);
  await page.goto("/sell", { waitUntil: "domcontentloaded", timeout: 180_000 });
  await expect(page.getByRole("button", { name: /add photo/i })).toBeVisible({ timeout: 120_000 });
  await page.waitForTimeout(400);
}

/** Photos region — first file input when multiple pickers exist on the sell form. */
export function sellPhotoInput(page: Page) {
  return page.getByRole("region", { name: "Add Photos" }).locator('input[type="file"]').first();
}

export async function uploadSellPhoto(page: Page, filePath: string | string[]): Promise<void> {
  await sellPhotoInput(page).setInputFiles(filePath);
  await expect(page.locator('img[alt="Cover photo"]')).toBeVisible({ timeout: 15_000 });
  await dismissBlockingDialogs(page);
}

async function dismissBlockingDialogs(page: Page): Promise<void> {
  const photoPreview = page.getByRole("dialog", { name: "Photo preview" });
  if (await photoPreview.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape");
    await expect(photoPreview).toBeHidden({ timeout: 5_000 });
  }
}

export async function fillSellDescription(page: Page, description: string): Promise<void> {
  const field = page.getByPlaceholder(/tell buyers more about/i);
  await expect(field).toBeVisible({ timeout: 15_000 });
  await field.fill(description);
  await field.blur();
}

export async function fillSellTitle(page: Page, title: string): Promise<void> {
  const field = page.getByPlaceholder(/tell buyers what you're selling/i);
  await expect(field).toBeVisible({ timeout: 15_000 });
  await field.fill(title);
  await field.blur();
}

/** Select a leaf category via the sell category picker (required before publish). */
export async function ensureCategorySelected(page: Page): Promise<void> {
  const categoryButton = page.getByRole("button", { name: /select category/i });
  await expect(categoryButton).toBeVisible({ timeout: 15_000 });
  await categoryButton.click();
  await expect(page.getByRole("heading", { name: "Category" })).toBeVisible({ timeout: 10_000 });

  if (await page.getByText("Suggested", { exact: true }).isVisible().catch(() => false)) {
    await page.locator("ul").first().getByRole("button").first().click();
  } else if (await page.getByRole("button", { name: /^Home & Garden$/i }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: /^Home & Garden$/i }).click();
    await page.getByRole("button", { name: /^Bedding$/i }).click();
    await page.getByRole("button", { name: /^Pillows$/i }).click();
    await page.locator("main, [class*='modal']").last().getByRole("button").first().click({ timeout: 15_000 });
  } else if (await page.getByRole("button", { name: /^Electronics$/i }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: /^Electronics$/i }).click();
    await page.getByRole("button", { name: /^Phones$/i }).click();
    const leaf = page.getByRole("button").filter({ hasText: /phone|mobile|smartphone/i }).first();
    if (await leaf.isVisible().catch(() => false)) {
      await leaf.click();
    } else {
      await page.getByRole("button").filter({ hasText: /.+/ }).nth(1).click();
    }
  } else {
    await page.getByRole("button").filter({ hasText: /.+/ }).first().click();
  }

  await expect(page.getByRole("heading", { name: "Category" })).toBeHidden({ timeout: 15_000 });
  await page.waitForTimeout(400);
}

export async function ensureParcelSizeSelected(page: Page): Promise<void> {
  const parcelButton = page.getByRole("button", { name: /select parcel size/i });
  if (!(await parcelButton.isVisible().catch(() => false))) return;

  const needsSelection = await parcelButton.evaluate((el) => {
    const spans = el.querySelectorAll("span.block");
    const value = spans[1]?.textContent?.trim() ?? "";
    return value.length === 0 || /select parcel size/i.test(value);
  });
  if (!needsSelection) return;

  await parcelButton.click();
  const dialog = page.getByRole("dialog", { name: "Select parcel size" });
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole("radio", { name: /Medium/i }).first().click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

export async function publishSellListing(page: Page): Promise<void> {
  await dismissBlockingDialogs(page);
  const publishBtn = page.getByRole("button", { name: /^publish listing$/i });
  await expect(publishBtn).toBeEnabled({ timeout: 60_000 });
  await publishBtn.click();
  await expect(page).toHaveURL(/\/listing\//, { timeout: 120_000 });
}
