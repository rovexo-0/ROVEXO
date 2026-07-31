import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADDRESS_SCOPE_TO_STORAGE,
  addCtaLabelForScope,
  defaultBadgeForScope,
  listTitleForScope,
} from "@/lib/addresses/canonical";
import {
  ADDRESSES_COMPONENTS_DIR,
  ADDRESSES_MANDATORY_COMPONENTS,
  ADDRESSES_MASTER_LOCK_DOM,
  ADDRESSES_MOCKUP_REF,
  ADDRESSES_STATUS,
  ADDRESSES_UI_DATA_ATTR,
} from "@/lib/addresses/freeze";
import { resolveBusinessAddressesVisibility } from "@/lib/master-engine";
import { lookupUkAddressesByPostcode, normalizeUkPostcode } from "@/lib/addresses/uk-lookup";

const root = process.cwd();
const addressesDir = join(root, ADDRESSES_COMPONENTS_DIR);

describe("Addresses v1.0 final implementation", () => {
  it("keeps freeze + mockup markers", () => {
    expect(ADDRESSES_STATUS).toContain("PERMANENT_LOCK");
    expect(ADDRESSES_UI_DATA_ATTR).toBe("v1.0-ui-lock");
    expect(ADDRESSES_MASTER_LOCK_DOM).toBe("v1.0-master-page-lock");
    expect(ADDRESSES_MOCKUP_REF).toBe("IMAGE_MOCKUP_#3");
  });

  it("requires all mandatory components", () => {
    for (const file of ADDRESSES_MANDATORY_COMPONENTS) {
      expect(existsSync(join(addressesDir, file)), `missing ${file}`).toBe(true);
    }
  });

  it("maps scopes and labels", () => {
    expect(ADDRESS_SCOPE_TO_STORAGE.personal).toBe("shipping");
    expect(ADDRESS_SCOPE_TO_STORAGE.business).toBe("billing");
    expect(listTitleForScope("personal")).toBe("Personal Addresses");
    expect(listTitleForScope("business")).toBe("Business Addresses");
    expect(addCtaLabelForScope("personal")).toBe("Add Address");
    expect(addCtaLabelForScope("business")).toBe("Add Business Address");
    expect(defaultBadgeForScope("personal")).toBe("Default");
    expect(defaultBadgeForScope("business")).toBe("Default Business");
  });

  it("Phase C — Business addresses tab hidden in v1.0 (components retained for v2.0)", () => {
    expect(resolveBusinessAddressesVisibility({ isBusinessVerified: false }).showBusinessAddressesTab).toBe(
      false,
    );
    expect(resolveBusinessAddressesVisibility({ isBusinessVerified: true }).showBusinessAddressesTab).toBe(
      false,
    );
  });

  it("card has Edit only — Delete is sheet + confirmation", () => {
    const card = readFileSync(join(addressesDir, "AddressCard.tsx"), "utf8");
    const edit = readFileSync(join(addressesDir, "EditAddress.tsx"), "utf8");
    const page = readFileSync(join(addressesDir, "AddressesPage.tsx"), "utf8");
    expect(card).toContain("Edit");
    expect(card).not.toMatch(/\bDelete\b/);
    expect(edit).toContain("Delete Address");
    expect(edit).toContain("confirm-delete");
    expect(edit).toMatch(/>\s*Delete\s*</);
    expect(page).toContain("EditAddress");
    expect(page).toContain("searchAddress");
    expect(page).toContain("selectLookupAddress");
    expect(page).toContain("action: \"set_default\"");
    const form = readFileSync(join(addressesDir, "AddressForm.tsx"), "utf8");
    expect(form).toContain("Search Address");
    expect(form).not.toMatch(/\bDelete Address\b/);
  });

  it("tabs hide Business in v1.0 via Master Engine gate (Phase C)", () => {
    const tabs = readFileSync(join(addressesDir, "AddressesTabs.tsx"), "utf8");
    expect(tabs).toContain("Personal");
    expect(tabs).toContain("Business");
    expect(tabs).toContain("resolveBusinessAddressesVisibility");
    expect(tabs).toContain("showBusiness");
  });

  it("UK lookup normalises and returns multiple addresses per postcode", async () => {
    expect(normalizeUkPostcode("WS29RD")).toBe("WS2 9RD");
    expect(normalizeUkPostcode("ws2 9aj")).toBe("WS2 9AJ");
    const walsall = await lookupUkAddressesByPostcode("WS29RD");
    expect(walsall.length).toBeGreaterThan(1);
    expect(walsall[0]?.line1).toBe("83 Darlaston Road");
    const dora = await lookupUkAddressesByPostcode("WS2 9AJ");
    expect(dora[0]?.line1).toBe("92 Dora Street");
  });

  it("uses Profile tokens in Addresses CSS", () => {
    const css = readFileSync(join(root, "styles/rovexo/addresses-v1.css"), "utf8");
    expect(css).toContain("--fw-");
    expect(css).toContain("addresses-v1-tabs");
    expect(css).toContain("addresses-v1-card");
    expect(css).not.toContain("addresses-v1-card__action--danger");
  });
});
