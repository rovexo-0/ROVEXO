import { expect, type Page } from "@playwright/test";
import { signInWithSessionCookies } from "./auth";
import { DEMO_USERS } from "@/lib/demo-environment/config";

const SELL_DRAFT_STORAGE_KEY = "rovexo:sell-draft";
const SELL_UPLOAD_SESSION_KEY = "rovexo:sell-upload-session";

const DEMO_SELLER = DEMO_USERS.find((u) => u.key === "live-seller")!;

/** Full Demo seller session for Sell E2E (no UI login). */
export async function signInDemoSeller(page: Page, baseURL: string): Promise<void> {
  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await signInWithSessionCookies(page, {
    email: DEMO_SELLER.email,
    password: DEMO_SELLER.password ?? "RovexoSeller@2026",
    baseURL,
  });
  const accept = page.getByRole("button", { name: /^Accept$/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

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
  const accept = page.getByRole("button", { name: /^Accept$/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
  await expect(page.locator('[aria-label="Add Photos"]').first()).toBeVisible({ timeout: 120_000 });
  await page.waitForTimeout(400);
}

/** Native Photo Picker file input — one-tap OS gallery (multi-select safe for E2E). */
export function sellPhotoInput(page: Page) {
  return page
    .locator(
      'input[type="file"][data-native-photo-picker], input[type="file"][data-universal-photo-intent="gallery"]',
    )
    .first();
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
    .getByLabel(/^Description$/i)
    .or(page.getByLabel(/listing description/i))
    .or(page.getByPlaceholder(/add extra details|tell buyers more about|describe/i))
    .first();
  await expect(field).toBeVisible({ timeout: 30_000 });
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
  const categoryButton = page.getByRole("button", { name: /^Category\b/i }).first();
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
    // Master Freeze: empty rows show label + chevron only (no "Select …" placeholders).
    const incomplete = page
      .getByRole("button", {
        // Season Rating / Length are OPTIONAL — do not force-fill for Publish.
        name: /^(Brand|Colours?|Color|Size|Model|Storage|Platform|Battery|Material|Network|Compatibility|RAM)$/i,
      })
      .first();
    if (!(await incomplete.isVisible().catch(() => false))) break;

    await incomplete.scrollIntoViewIfNeeded();
    await incomplete.click();

    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // List layout uses buttons; grid/swatch may use role=radio.
    const option = dialog
      .getByRole("radio")
      .or(dialog.locator("[role='radiogroup'] button, ul button").filter({ hasNotText: /^Back$/i }))
      .first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  }
}

export async function ensureConditionSelected(page: Page): Promise<void> {
  const conditionButton = page.getByRole("button", { name: /^Condition\b/i }).first();
  if (!(await conditionButton.isVisible().catch(() => false))) {
    // Condition is optional for Absolute Authority core-6 publish.
    return;
  }
  const text = (await conditionButton.innerText().catch(() => "")).trim();
  // Already selected when value text appears beyond the label.
  if (/condition/i.test(text) && text.replace(/condition/i, "").trim().length > 0) {
    return;
  }
  await conditionButton.scrollIntoViewIfNeeded();
  await conditionButton.click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  const option = dialog.getByRole("radio", { name: /^New$/i }).or(dialog.getByRole("button", { name: /^New$/i })).first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
  await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
}

export async function ensureParcelSizeSelected(page: Page): Promise<void> {
  const parcelButton = page.getByRole("button", { name: /^Parcel Size\b/i }).first();
  if (!(await parcelButton.isVisible().catch(() => false))) return;

  const label = (await parcelButton.innerText().catch(() => "")).toLowerCase();
  if (/(small|medium|large|extra)/.test(label)) {
    return;
  }

  await parcelButton.scrollIntoViewIfNeeded();
  await parcelButton.click();
  const dialog = page.getByRole("dialog", { name: /parcel/i });
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole("radio", { name: /Medium/i }).or(dialog.getByRole("button", { name: /Medium/i })).first().click();
  await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
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
  // Success stays on /sell with publish dialog (Share Listing / View Listing / Sell Another Item).
  await expect(
    page.getByRole("button", { name: /share listing|^Share$/i }),
  ).toBeVisible({ timeout: 120_000 });
}
