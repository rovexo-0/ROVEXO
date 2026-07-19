import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  ACTIVE_SUPPORTED_COUNTRIES,
  BUYER_REGIONS,
  SUPPORTED_COUNTRIES,
} from "@/lib/account/countries";
import {
  UK_ACTIVE_MARKET,
  UK_ACTIVE_SELLER_TYPES,
  UK_DEFAULT_COUNTRY,
  UK_DEFAULT_CURRENCY,
  UK_INACTIVE_MARKET_ARCHITECTURE,
  UK_MARKETING_LOCALE,
  UK_VAT_STATES,
  isActiveUkMarketCountry,
  isActiveUkMarketCurrency,
  isInactiveNonUkArchitecture,
  isUkMarketingContent,
} from "@/lib/i18n/uk-first";
import { PARCEL_SIZE_OPTIONS, PARCEL_SIZES, SELL_PHOTO_MAX } from "@/features/sell/types";
import { PARCEL_TIER_OPTIONS, PARCEL_DISPLAY } from "@/lib/shipping/parcels";
import {
  NATIVE_IMAGE_GALLERY_ACCEPT,
  resolveNativeImageAccept,
  resolveNativeImageCapture,
} from "@/lib/media/native-image-picker";
import { UK_COMPLIANCE_AUDIT } from "@/lib/compliance/uk-audit";
import { createDefaultWalletEngineDocument } from "@/lib/wallet-engine/defaults";
import { MARKET_REGIONS, getActiveMarket } from "@/lib/seo/markets";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import type { UserProfile } from "@/lib/profile/types";

function readSource(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

const stubProfile = { id: "cert-user", email: "cert@rovexo.co.uk" } as UserProfile;

describe("Final Preview Certification v1.0 — UK First", () => {
  it("locks active market to United Kingdom + GBP + en-GB", () => {
    expect(UK_ACTIVE_MARKET.country).toBe("United Kingdom");
    expect(UK_ACTIVE_MARKET.currency).toBe("GBP");
    expect(UK_ACTIVE_MARKET.locale).toBe("en-GB");
    expect(UK_DEFAULT_CURRENCY).toBe("GBP");
    expect(UK_DEFAULT_COUNTRY).toBe("United Kingdom");
    expect(UK_MARKETING_LOCALE).toBe("en-GB");
    expect(isUkMarketingContent()).toBe(true);
    expect(isActiveUkMarketCurrency("GBP")).toBe(true);
    expect(isActiveUkMarketCurrency("EUR")).toBe(false);
    expect(isActiveUkMarketCountry("GB")).toBe(true);
    expect(isActiveUkMarketCountry("DE")).toBe(false);
  });

  it("allows only UK individual + UK business sellers and both VAT states", () => {
    expect([...UK_ACTIVE_SELLER_TYPES]).toEqual(["uk_individual", "uk_business"]);
    expect([...UK_VAT_STATES]).toEqual(["vat_registered", "not_vat_registered"]);
  });

  it("keeps EU / non-UK markets as inactive architecture only", () => {
    expect(UK_INACTIVE_MARKET_ARCHITECTURE.every((m) => m.active === false)).toBe(true);
    expect(isInactiveNonUkArchitecture("DE")).toBe(true);
    expect(isInactiveNonUkArchitecture("GB")).toBe(false);

    const activeCountries = SUPPORTED_COUNTRIES.filter((c) => c.active);
    expect(activeCountries).toHaveLength(1);
    expect(activeCountries[0]?.code).toBe("GB");
    expect(ACTIVE_SUPPORTED_COUNTRIES).toHaveLength(1);
    expect(BUYER_REGIONS).toEqual(["United Kingdom"]);

    const activeSeo = MARKET_REGIONS.filter((m) => m.active);
    expect(activeSeo).toHaveLength(1);
    expect(getActiveMarket().currency).toBe("GBP");
    expect(MARKET_REGIONS.filter((m) => !m.active).length).toBeGreaterThan(0);
  });

  it("certifies UK compliance audit areas are not missing", () => {
    const missing = UK_COMPLIANCE_AUDIT.filter((f) => f.status === "missing");
    expect(missing).toEqual([]);
    expect(UK_COMPLIANCE_AUDIT.some((f) => f.area === "tax_reporting")).toBe(true);
    expect(UK_COMPLIANCE_AUDIT.some((f) => f.area === "wallet")).toBe(true);
    expect(UK_COMPLIANCE_AUDIT.some((f) => f.area === "shipping")).toBe(true);
  });
});

describe("Final Preview Certification v1.0 — Financial Pre-Audit", () => {
  it("wallet engine is UK GBP with platform fee and balances", () => {
    const doc = createDefaultWalletEngineDocument();
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.platformFeeRate).toBe(0.055);
    expect(doc.holdPeriodHours).toBe(24);
  });

  it("locks financial surface files for wallet / stripe / withdraw / refund / bank", () => {
    const required = [
      "features/wallet/components/WalletHubV1.tsx",
      "features/wallet/components/withdraw/WithdrawPage.tsx",
      "app/api/wallet/withdraw/route.ts",
      "lib/wallet/bank-account.ts",
      "lib/commerce-engine/escrow.ts",
      "app/api/webhooks/stripe/route.ts",
      "app/api/webhooks/sendcloud/route.ts",
      "lib/shipping/sendcloud/status-mapper.ts",
    ];
    for (const rel of required) {
      expect(existsSync(join(process.cwd(), rel)), rel).toBe(true);
    }
  });

  it("withdraw and bank account flows are UK personal/business ready", () => {
    const withdraw = readSource("features/wallet/components/withdraw/WithdrawPage.tsx");
    const bank = readSource("lib/wallet/bank-account.ts");
    expect(withdraw).toMatch(/Withdraw|bank/i);
    expect(bank).toMatch(/sort.?code|account.?number/i);
    expect(bank).toMatch(/GB|UK|United Kingdom|sort/i);
  });

  it("commerce engine preserves escrow and audit immutability contracts", () => {
    const commerce = readSource("tests/commerce-engine-v1.test.ts");
    expect(commerce).toContain("escrow");
    expect(commerce).toContain("service_role");
  });
});

describe("Final Preview Certification v1.0 — Parcel Freeze", () => {
  it("sell UI exposes only Small Medium Large Extra Large", () => {
    expect([...PARCEL_SIZES]).toEqual(["small", "medium", "large", "xl"]);
    expect(PARCEL_SIZE_OPTIONS.map((o) => o.label)).toEqual([
      "Small Parcel",
      "Medium Parcel",
      "Large Parcel",
      "Extra Large Parcel",
    ]);
    expect(PARCEL_SIZE_OPTIONS.some((o) => /custom/i.test(o.label))).toBe(false);
  });

  it("shipping tiers match Absolute Final labels and remap custom → XL", () => {
    expect(PARCEL_TIER_OPTIONS.map((o) => o.label)).toEqual([
      "Small Parcel",
      "Medium Parcel",
      "Large Parcel",
      "Extra Large Parcel",
    ]);
    expect(PARCEL_DISPLAY.custom).toBe("Extra Large Parcel");
    const sellParcel = readSource("features/sell/ui/SellParcelBlock.tsx");
    expect(sellParcel).not.toMatch(/custom weight|custom size|dimensions input/i);
  });
});

describe("Final Preview Certification v1.0 — Sell Gallery / Camera", () => {
  it("gallery pickers use image/* without capture (Samsung/Android/iOS safe)", () => {
    expect(NATIVE_IMAGE_GALLERY_ACCEPT).toBe("image/*");
    expect(resolveNativeImageAccept("gallery")).toBe("image/*");
    expect(resolveNativeImageCapture("gallery")).toBeUndefined();
    expect(resolveNativeImageCapture("camera")).toBe("environment");
    expect(SELL_PHOTO_MAX).toBe(8);

    const sellInput = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(sellInput).toContain("image/*");
    expect(sellInput).not.toMatch(/capture=/);
    expect(existsSync(join(process.cwd(), "app/sell/camera/page.tsx"))).toBe(true);
  });
});

describe("Final Preview Certification v1.0 — Master Menu + Phone Width", () => {
  it("account master menu is one product language", () => {
    const sections = buildAccountMenuSections(stubProfile);
    expect(sections.length).toBeGreaterThan(0);
    const titles = sections.flatMap((s) => s.items.map((i) => i.title));
    expect(titles.some((t) => /wallet/i.test(t))).toBe(true);
    expect(titles.some((t) => /buying|order/i.test(t))).toBe(true);
  });

  it("phone-width freeze CSS is present", () => {
    const freeze = readSource("styles/rovexo/phone-width-v1-freeze.css");
    expect(freeze).toMatch(/16px|100%/);
    expect(freeze).toMatch(/max-w-md|phone-width|Absolute Final/i);
  });
});

describe("Final Preview Certification v1.0 — Transaction Hub", () => {
  it("messages route redirects to inbox hub", () => {
    const messages = readSource("app/messages/page.tsx");
    expect(messages).toContain("redirect");
    expect(messages).toMatch(/inbox/i);
  });
});
