import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTION_ORIGIN } from "@/lib/preview/owner-preview-ssot";
import { sellerPageMetadata } from "@/lib/seo/engine/metadata";
import {
  STORE_SHARE_PRODUCTION_URL_PREFIX,
  assertStoreShareProductionUrl,
  buildStoreFacebookShareUrl,
  buildStoreMessengerShareUrl,
  buildStoreOgDescription,
  buildStoreOgImageUrl,
  buildStoreOgTitle,
  buildStorePath,
  buildStoreQrTargetUrl,
  buildStoreShareMetadata,
  buildStoreShareNativePayload,
  buildStoreShareText,
  buildStoreShareUtmUrl,
  buildStoreTelegramShareUrl,
  buildStoreUrl,
  buildStoreWhatsAppShareUrl,
  formatStoreShareRatingLabel,
  parseStoreHandlePath,
  resolveStoreHandleRewrite,
  storeShareUrlContainsForbiddenHost,
  toStoreShareData,
} from "@/lib/store-sharing/store-share-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function ratedSeller() {
  return toStoreShareData({
    username: "mishuu",
    displayName: "mishuu",
    verified: true,
    rating: 4.8,
    reviewCount: 12,
    followersCount: 40,
    followingCount: 3,
    activeListingsCount: 7,
  });
}

function newSeller() {
  return toStoreShareData({
    username: "newshop",
    displayName: "newshop",
    verified: false,
    rating: 5,
    reviewCount: 0,
    followersCount: 0,
    followingCount: 0,
    activeListingsCount: 0,
  });
}

describe("Store Sharing Engine v1", () => {
  it("1. generates the canonical /@username store URL", () => {
    expect(buildStorePath("mishuu")).toBe("/@mishuu");
    expect(buildStoreUrl("mishuu")).toBe(`${PRODUCTION_ORIGIN}/@mishuu`);
    expect(buildStoreUrl("@mishuu")).toBe("https://www.rovexo.co.uk/@mishuu");
  });

  it("STORE_SHARE_PRODUCTION_URL=PASS", () => {
    const url = buildStoreUrl("mishuu");
    expect(url).toBe("https://www.rovexo.co.uk/@mishuu");
    expect(url.startsWith(STORE_SHARE_PRODUCTION_URL_PREFIX)).toBe(true);
    expect(ratedSeller().storeUrl).toBe("https://www.rovexo.co.uk/@mishuu");
    expect(buildStoreShareMetadata(ratedSeller()).canonicalUrl).toBe(
      "https://www.rovexo.co.uk/@mishuu",
    );
  });

  it("STORE_SHARE_NO_LOCALHOST=PASS", () => {
    const engine = readSource("lib/store-sharing/store-share-v1.ts");
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    const card = readSource("features/store-sharing/StoreShareCard.tsx");
    expect(engine).not.toContain("getAppUrl");
    expect(engine).not.toContain("window.location");
    expect(sheet).not.toContain("window.location.origin");
    expect(card).not.toContain("localhost");
    expect(buildStoreUrl("mishuu")).not.toMatch(/localhost|127\.0\.0\.1|192\.168\./);
    expect(storeShareUrlContainsForbiddenHost("http://localhost:3000/@mishuu")).toBe(true);
    expect(storeShareUrlContainsForbiddenHost("http://127.0.0.1:3000/@mishuu")).toBe(true);
    expect(storeShareUrlContainsForbiddenHost("http://192.168.1.10:3000/@mishuu")).toBe(true);
    expect(storeShareUrlContainsForbiddenHost("http://10.0.0.8/@mishuu")).toBe(true);
    expect(storeShareUrlContainsForbiddenHost("http://172.16.0.4/@mishuu")).toBe(true);
    expect(storeShareUrlContainsForbiddenHost("https://www.rovexo.co.uk/@mishuu")).toBe(false);
    expect(() => assertStoreShareProductionUrl("http://localhost:3000/@mishuu")).toThrow(
      "STORE_SHARE_NON_PRODUCTION_URL",
    );
    expect(() =>
      assertStoreShareProductionUrl("https://www.rovexo.co.uk/@mishuu"),
    ).not.toThrow();
  });

  it("2. generates predefined share text with the store URL", () => {
    const url = buildStoreUrl("mishuu");
    const text = buildStoreShareText(url);
    expect(text).toContain("Check out my store on ROVEXO!");
    expect(text).toContain("Buy • Sell • Grow on ROVEXO");
    expect(text).toContain(url);
    expect(text).not.toContain("/listing/");
  });

  it("3. zero-review seller shows New seller — never invented 5.0", () => {
    const seller = newSeller();
    expect(seller.rating).toBeNull();
    expect(formatStoreShareRatingLabel(seller)).toBe("New seller");
    expect(formatStoreShareRatingLabel(seller)).not.toContain("5.0");
    expect(formatStoreShareRatingLabel(seller)).not.toContain("0 Reviews");
  });

  it("4. rated seller shows real rating and review count", () => {
    const seller = ratedSeller();
    expect(seller.rating).toBe(4.8);
    expect(formatStoreShareRatingLabel(seller)).toBe("⭐ 4.8 (12 Reviews)");
  });

  it("5. zero listings stay 0 Listings", () => {
    expect(newSeller().activeListingsCount).toBe(0);
  });

  it("6. multiple listings keep the real count", () => {
    expect(ratedSeller().activeListingsCount).toBe(7);
  });

  it("7. verified seller keeps verified=true", () => {
    expect(ratedSeller().verified).toBe(true);
  });

  it("8. unverified seller keeps verified=false", () => {
    expect(newSeller().verified).toBe(false);
  });

  it("9. public store route rewrites /@username to the existing profile page", () => {
    expect(parseStoreHandlePath("/@mishuu")).toBe("mishuu");
    expect(resolveStoreHandleRewrite("/@mishuu")).toBe("/user/mishuu");
    expect(resolveStoreHandleRewrite("/user/mishuu")).toBeNull();
    const middleware = readSource("lib/seo/engine/middleware-handler.ts");
    const config = readSource("next.config.ts");
    expect(middleware).toContain("resolveStoreHandleRewrite");
    expect(config).toContain('source: "/@:username"');
    expect(config).toContain('destination: "/user/:username"');
  });

  it("10. Listings tab is the default public store tab", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain('useState<MainTab>("store")');
    expect(page).toContain('["store", "Listings"]');
  });

  it("11. private listings stay excluded from the public store query", () => {
    const publicProfile = readSource("lib/profile/public.ts");
    expect(publicProfile).toContain('surface: "seller"');
    expect(publicProfile).toContain("getEligibleListings");
    expect(publicProfile).not.toContain('status: "draft"');
  });

  it("STORE_SHARE_COPY_LINK=PASS", () => {
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("store_share_copy_link");
    expect(sheet).toContain("STORE_SHARE_COPY.copied");
    expect(sheet).toContain("data.storeUrl");
    expect(ratedSeller().storeUrl).toBe("https://www.rovexo.co.uk/@mishuu");
  });

  it("STORE_SHARE_NATIVE_SHARE=PASS", () => {
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("navigator.share");
    expect(sheet).toContain("StoreShareActions");
    expect(sheet).toContain("copyStoreLink");
    const native = buildStoreShareNativePayload(ratedSeller());
    expect(native.title).toBe("mishuu's Store on ROVEXO");
    expect(native.url).toBe("https://www.rovexo.co.uk/@mishuu");
  });

  it("STORE_SHARE_QR_TARGET=PASS", () => {
    expect(buildStoreQrTargetUrl("mishuu")).toBe("https://www.rovexo.co.uk/@mishuu");
    expect(buildStoreQrTargetUrl("mishuu")).not.toContain("localhost");
    expect(buildStoreQrTargetUrl("mishuu")).not.toContain("/listing/");
    const qr = readSource("features/store-sharing/StoreQRCode.tsx");
    expect(qr).toContain("buildStoreQrImageUrl");
    expect(qr).toContain("QR code for ${data.displayName}'s ROVEXO store");
  });

  it("STORE_SHARE_WHATSAPP=PASS", () => {
    const href = buildStoreWhatsAppShareUrl(buildStoreUrl("mishuu"));
    expect(href).toContain("wa.me");
    expect(href).toContain(encodeURIComponent("https://www.rovexo.co.uk/@mishuu"));
    expect(href).not.toContain("localhost");
  });

  it("STORE_SHARE_FACEBOOK=PASS", () => {
    const href = buildStoreFacebookShareUrl(buildStoreUrl("mishuu"));
    expect(href).toContain("facebook.com/sharer");
    expect(href).toContain(encodeURIComponent("https://www.rovexo.co.uk/@mishuu"));
  });

  it("STORE_SHARE_INSTAGRAM=PASS", () => {
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain('channel === "instagram"');
    expect(sheet).toContain("copyText(shareText)");
    expect(sheet).toContain("STORE_SHARE_COPY.instagramHint");
    expect(buildStoreShareText(buildStoreUrl("mishuu"))).toContain(
      "https://www.rovexo.co.uk/@mishuu",
    );
  });

  it("STORE_SHARE_MESSENGER=PASS", () => {
    const href = buildStoreMessengerShareUrl(buildStoreUrl("mishuu"));
    expect(href).toContain("facebook.com/dialog/send");
    expect(href).toContain(encodeURIComponent("https://www.rovexo.co.uk/@mishuu"));
  });

  it("STORE_SHARE_TELEGRAM=PASS", () => {
    const url = buildStoreUrl("mishuu");
    const href = buildStoreTelegramShareUrl(url, buildStoreShareText(url));
    expect(href).toContain("t.me/share/url");
    expect(href).toContain(encodeURIComponent("https://www.rovexo.co.uk/@mishuu"));
  });

  it("STORE_SHARE_MORE=PASS", () => {
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain('channel === "more"');
    expect(sheet).toContain("nativeShare()");
    expect(sheet).toContain("copyStoreLink");
  });

  it("SOCIAL_BRAND_ICONS=PASS", () => {
    const actions = readSource("features/store-sharing/StoreShareActions.tsx");
    expect(actions).toContain("data-store-share-icon={channel.id}");
    expect(actions).toContain('id: "whatsapp"');
    expect(actions).toContain('id: "facebook"');
    expect(actions).toContain('id: "instagram"');
    expect(actions).toContain('id: "messenger"');
    expect(actions).toContain('id: "telegram"');
    expect(actions).toContain("M17.472 14.382");
    expect(actions).toContain("M24 12.073");
    expect(actions).toContain("M12 2.163");
    expect(actions).toContain("M12 2C6.477 2 2 6.145");
    expect(actions).toContain("M11.944 0A12");
    expect(actions).toContain("PlatformEmoji");
    expect(actions).toContain("PLATFORM_EMOJI.copy");
    expect(actions).toContain("PLATFORM_EMOJI.qr");
    expect(actions).toContain("PLATFORM_EMOJI.share");
    expect(actions).not.toContain('from "lucide-react"');
  });

  it("PLACEHOLDER_LETTER_ICONS=NO", () => {
    const actions = readSource("features/store-sharing/StoreShareActions.tsx");
    expect(actions).not.toContain("channel.label.slice(0, 1)");
    expect(actions).not.toContain(".slice(0, 1)");
  });

  it("12. Copy Link copies the canonical store URL", () => {
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("store_share_copy_link");
    expect(sheet).toContain("STORE_SHARE_COPY.copied");
    expect(sheet).toContain("data.storeUrl");
  });

  it("13. native share has a custom-sheet fallback", () => {
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("navigator.share");
    expect(sheet).toContain("StoreShareActions");
    expect(sheet).toContain("copyStoreLink");
    const native = buildStoreShareNativePayload(ratedSeller());
    expect(native.title).toBe("mishuu's Store on ROVEXO");
    expect(native.url).toContain("/@mishuu");
  });

  it("14. Open Graph metadata represents the store", () => {
    const meta = buildStoreShareMetadata(ratedSeller());
    expect(meta.title).toBe("mishuu's Store on ROVEXO");
    expect(meta.description).toBe("Discover 7 items from mishuu on ROVEXO.");
    expect(meta.ogType).toBe("website");
    expect(meta.twitterCard).toBe("summary_large_image");
    expect(meta.ogImagePath).toContain("/api/seo/og?");
    expect(meta.ogImagePath).toContain("kind=store");
    expect(meta.ogImageUrl).toBe(buildStoreOgImageUrl(ratedSeller()));
    const og = readSource("app/api/seo/og/route.ts");
    expect(og).toContain('kind === "store"');
    expect(og).toContain("VIEW STORE");
    expect(og).toContain("STORE_SHARE_COPY.promoLine");
    expect(readSource("lib/store-sharing/store-share-v1.ts")).toContain("Buy • Sell • Grow on ROVEXO");
    expect(og).toContain("image/png");
    expect(og).toContain("X-ROVEXO-OG-Store");
    expect(og).not.toContain("image/svg+xml");
  });

  it("15. canonical URL is /@username", () => {
    const meta = buildStoreShareMetadata(ratedSeller());
    expect(meta.canonicalPath).toBe("/@mishuu");
    expect(meta.canonicalUrl).toBe("https://www.rovexo.co.uk/@mishuu");
    const sellerMeta = readSource("lib/seo/engine/metadata.ts");
    expect(sellerMeta).toContain("buildStoreShareMetadata");
    expect(sellerMeta).toContain("canonical: meta.canonicalUrl");
    expect(sellerMeta).toContain("url: meta.canonicalUrl");
    expect(sellerMeta).toContain("title: { absolute: meta.title }");
    expect(sellerMeta).not.toContain("getAppUrl");
  });

  it("STORE_METADATA_TITLE=PASS", () => {
    expect(buildStoreOgTitle("mishuu")).toBe("mishuu's Store on ROVEXO");
    expect(buildStoreShareMetadata(ratedSeller()).title).toBe("mishuu's Store on ROVEXO");
    expect(sellerPageMetadata({ username: "mishuu", listingCount: 8 }).openGraph?.title).toBe(
      "mishuu's Store on ROVEXO",
    );
  });

  it("STORE_METADATA_DESCRIPTION=PASS", () => {
    expect(buildStoreOgDescription("mishuu", 8)).toBe("Discover 8 items from mishuu on ROVEXO.");
    expect(buildStoreOgDescription("mishuu", null)).toBe(
      "Discover unique items from mishuu on ROVEXO.",
    );
    expect(
      sellerPageMetadata({ username: "mishuu", listingCount: 8 }).openGraph?.description,
    ).toBe("Discover 8 items from mishuu on ROVEXO.");
  });

  it("STORE_METADATA_URL=PASS", () => {
    const page = sellerPageMetadata({ username: "mishuu", listingCount: 8 });
    expect(page.openGraph?.url).toBe("https://www.rovexo.co.uk/@mishuu");
    expect(page.alternates?.canonical).toBe("https://www.rovexo.co.uk/@mishuu");
  });

  it("STORE_METADATA_IMAGE=PASS", () => {
    const page = sellerPageMetadata({ username: "mishuu", listingCount: 8 });
    const image = Array.isArray(page.openGraph?.images) ? page.openGraph.images[0] : null;
    const imageUrl = typeof image === "object" && image && "url" in image ? String(image.url) : "";
    expect(imageUrl.startsWith("https://www.rovexo.co.uk/api/seo/og?")).toBe(true);
    expect(imageUrl).toContain("kind=store");
    expect(imageUrl).toContain("username=mishuu");
    expect(imageUrl).not.toContain("localhost");
  });

  it("NO_GENERIC_STORE_TITLE=PASS", () => {
    const page = sellerPageMetadata({ username: "mishuu", listingCount: 8 });
    const blob = JSON.stringify(page);
    expect(blob).not.toContain("ROVEXO – Buy & Sell on the Modern Marketplace");
    expect(blob).not.toContain("Buy & Sell on the Modern Marketplace");
  });

  it("OG_USERNAME_ISOLATED=PASS", () => {
    const mishuu = sellerPageMetadata({ username: "mishuu", listingCount: 8 });
    const other = sellerPageMetadata({ username: "otherstore", listingCount: 3 });
    expect(mishuu.openGraph?.title).toBe("mishuu's Store on ROVEXO");
    expect(other.openGraph?.title).toBe("otherstore's Store on ROVEXO");
    expect(mishuu.openGraph?.url).toBe("https://www.rovexo.co.uk/@mishuu");
    expect(other.openGraph?.url).toBe("https://www.rovexo.co.uk/@otherstore");
    expect(mishuu.openGraph?.description).toBe("Discover 8 items from mishuu on ROVEXO.");
    expect(other.openGraph?.description).toBe("Discover 3 items from otherstore on ROVEXO.");
  });

  it("OG_IMAGE_USERNAME_ISOLATED=PASS", () => {
    const mishuu = buildStoreOgImageUrl(toStoreShareData({ username: "mishuu", activeListingsCount: 8 }));
    const other = buildStoreOgImageUrl(
      toStoreShareData({ username: "otherstore", activeListingsCount: 3 }),
    );
    expect(mishuu).toContain("username=mishuu");
    expect(other).toContain("username=otherstore");
    expect(mishuu).not.toContain("username=otherstore");
    expect(other).not.toContain("username=mishuu");
  });

  it("16. QR encodes the store URL — never a listing", () => {
    expect(buildStoreQrTargetUrl("mishuu")).toBe(`${PRODUCTION_ORIGIN}/@mishuu`);
    expect(buildStoreQrTargetUrl("mishuu")).not.toContain("/listing/");
    const qr = readSource("features/store-sharing/StoreQRCode.tsx");
    expect(qr).toContain("buildStoreQrImageUrl");
    expect(qr).toContain("QR code for ${data.displayName}'s ROVEXO store");
  });

  it("17. mobile share sheet respects safe-area", () => {
    const css = readSource("styles/rovexo/store-share-v1.css");
    expect(css).toContain("env(safe-area-inset-bottom");
    expect(css).toContain("max-width: 480px");
  });

  it("18. public store remains reachable without a new auth system", () => {
    const page = readSource("app/(platform)/user/[username]/page.tsx");
    expect(page).toContain("ViewProfilePage");
    expect(page).toContain("getAuthContext");
    expect(page).not.toContain("createAuth");
  });

  it("19. Follow remains the existing public-store action", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain("FollowButton");
    expect(page).toContain('from "@/components/follow/FollowButton"');
  });

  it("20. Share Store is wired on the public/profile store", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain("StoreShareSheet");
    expect(page).toContain("STORE_SHARE_COPY.cta");
    expect(page).toContain('aria-label={STORE_SHARE_COPY.cta}');
    expect(page).not.toContain("ItemBottomNav");
    expect(page).not.toContain('aria-label="Share profile"');
    expect(readSource("features/store/components/StoreVisitPageV2.tsx")).not.toContain(
      ">Share Store<",
    );
  });

  it("does not create a second listing card or share listing URL", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain("ListingCard");
    expect(page).not.toContain("StoreListingCard");
    expect(buildStoreFacebookShareUrl(buildStoreUrl("mishuu"))).toContain(
      encodeURIComponent(`${PRODUCTION_ORIGIN}/@mishuu`),
    );
    expect(buildStoreShareUtmUrl(`${PRODUCTION_ORIGIN}/@mishuu`, "facebook")).toContain(
      "utm_campaign=store_share",
    );
    expect(buildStoreShareUtmUrl(`${PRODUCTION_ORIGIN}/@mishuu`, "copy_link")).toBe(
      `${PRODUCTION_ORIGIN}/@mishuu`,
    );
  });

  it("rejects invalid usernames and does not invent AI copy", () => {
    expect(() => buildStorePath("../admin")).toThrow("STORE_SHARE_INVALID_USERNAME");
    const engine = readSource("lib/store-sharing/store-share-v1.ts");
    expect(engine).not.toContain("openai");
    expect(engine).not.toContain("OpenAI");
    expect(engine).toContain("ZERO AI");
  });

  it("does not regress Profile, Follow, Listings, or Visit Store", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    const visit = readSource("features/store/components/StoreVisitPageV2.tsx");
    const analytics = readSource("lib/analytics/marketplace-events.ts");
    expect(page).toContain("FollowButton");
    expect(page).toContain("ListingCard");
    expect(page).toContain("StoreShareSheet");
    expect(page).toContain("toStoreShareData");
    expect(visit).not.toContain("StoreShareSheet");
    expect(visit).not.toContain(">Share Store<");
    expect(analytics).toContain("store_url: buildStoreUrl(params.username)");
    expect(readSource("lib/store-sharing/store-share-v1.ts")).toContain("STORE_SHARE_ENGINE_V1");
    expect(readSource("app/api/seo/og/route.ts")).toContain('kind === "store"');
    expect(readSource("app/api/seo/og/route.ts")).not.toContain("/api/seo/store-og");
    expect(readSource("features/store-sharing/StoreShareSheet.tsx")).toContain("StoreShareCard");
    expect(readSource("app/(platform)/user/[username]/page.tsx")).toContain(
      "storeShareFallbackMetadata",
    );
  });
});
