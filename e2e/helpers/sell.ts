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
  const field = page
    .getByLabel(/listing description/i)
    .or(page.getByPlaceholder(/add extra details|tell buyers more about/i))
    .first();
  await expect(field).toBeVisible({ timeout: 15_000 });
  await field.scrollIntoViewIfNeeded();
  await field.fill(description);
  await field.blur();
}

export async function fillSellTitle(page: Page, title: string): Promise<void> {
  const field = page.getByPlaceholder(/what are you selling|tell buyers what you're selling/i);
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

/** Fill progressive brand/colour/size rows so condition/parcel/price unlock. */
export async function completeSellQuickAttributes(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const incomplete = page
      .locator("button")
      .filter({ hasText: /Select (brand|colour|color|size)/i })
      .first();
    if (!(await incomplete.isVisible().catch(() => false))) break;

    await incomplete.scrollIntoViewIfNeeded();
    await incomplete.click();

    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    const option = dialog.getByRole("radio").first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  }
}

export async function ensureConditionSelected(page: Page): Promise<void> {
  const group = page.getByRole("radiogroup", { name: /^Condition$/i });
  await expect(group).toBeVisible({ timeout: 30_000 });
  await group.getByRole("radio", { name: /^New$/i }).click();
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

/** Unlock price field: attributes → condition → parcel. */
export async function completeSellToPrice(page: Page): Promise<void> {
  await completeSellQuickAttributes(page);
  await ensureConditionSelected(page);
  await ensureParcelSizeSelected(page);
}

export async function publishSellListing(page: Page): Promise<void> {
  await dismissBlockingDialogs(page);
  // CTA label is "Publish"; the sticky bar region is aria-labelled "Publish listing".
  const publishBtn = page
    .getByRole("region", { name: /publish listing/i })
    .getByRole("button", { name: /^(Publish|Save changes)$/i });
  await expect(publishBtn).toBeEnabled({ timeout: 60_000 });
  await publishBtn.click();
  await expect(page).toHaveURL(/\/listing\//, { timeout: 120_000 });
}
