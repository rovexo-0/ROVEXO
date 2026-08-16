/**
 * Dynamic Store Share Card + Facebook mobile/desktop routing.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GET as ogGet } from "@/app/api/seo/og/route";
import { sellerPageMetadata } from "@/lib/seo/engine/metadata";
import {
  STORE_SHARE_COPY,
  buildStoreFacebookShareUrl,
  buildStoreOgImageUrl,
  buildStoreQrTargetUrl,
  buildStoreShareMetadata,
  buildStoreShareNativePayload,
  buildStoreTelegramShareUrl,
  buildStoreShareText,
  buildStoreUrl,
  buildStoreWhatsAppShareUrl,
  formatStoreSharePublicHost,
  formatStoreShareStatusLabel,
  isStoreShareMobileViewport,
  resolveStoreFacebookShareMode,
  resolveStoreShareCardDescription,
  toStoreShareData,
  truncateStoreShareCardText,
} from "@/lib/store-sharing/store-share-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function seller(overrides: Parameters<typeof toStoreShareData>[0]) {
  return toStoreShareData(overrides);
}

describe("Dynamic Store Share Card v1", () => {
  it("1–5. username, avatar, followers, listings, display name are dynamic", () => {
    const a = seller({
      username: "alpha-store",
      displayName: "Alpha Store",
      avatarUrl: "https://cdn.example.com/alpha.png",
      followersCount: 2,
      activeListingsCount: 8,
    });
    const b = seller({
      username: "beta-shop",
      displayName: "Beta Shop",
      avatarUrl: "https://cdn.example.com/beta.png",
      followersCount: 41,
      activeListingsCount: 3,
    });
    expect(a.username).toBe("alpha-store");
    expect(a.displayName).toBe("Alpha Store");
    expect(a.avatarUrl).toBe("https://cdn.example.com/alpha.png");
    expect(a.followersCount).toBe(2);
    expect(a.activeListingsCount).toBe(8);
    expect(b.username).toBe("beta-shop");
    expect(b.displayName).toBe("Beta Shop");
    expect(buildStoreOgImageUrl(a)).toContain("username=alpha-store");
    expect(buildStoreOgImageUrl(a)).toContain("followers=2");
    expect(buildStoreOgImageUrl(a)).toContain("listings=8");
    expect(buildStoreOgImageUrl(a)).toContain(encodeURIComponent("https://cdn.example.com/alpha.png"));
    expect(buildStoreOgImageUrl(b)).not.toContain("username=alpha-store");
    expect(buildStoreOgImageUrl(a)).not.toContain("username=beta-shop");
  });

  it("6–7. verified badge only when verified", () => {
    const verified = seller({ username: "v-store", verified: true });
    const plain = seller({ username: "p-store", verified: false });
    expect(verified.verified).toBe(true);
    expect(plain.verified).toBe(false);
    expect(buildStoreOgImageUrl(verified)).toContain("verified=1");
    expect(buildStoreOgImageUrl(plain)).toContain("verified=0");
  });

  it("8. missing avatar is omitted from OG image URL", () => {
    const data = seller({ username: "no-avatar", avatarUrl: null });
    expect(data.avatarUrl).toBeNull();
    expect(buildStoreOgImageUrl(data)).not.toContain("avatar=");
  });

  it("9. missing description uses canonical ROVEXO fallback", () => {
    expect(resolveStoreShareCardDescription(null)).toBe(STORE_SHARE_COPY.supporting);
    expect(resolveStoreShareCardDescription("")).toBe(STORE_SHARE_COPY.supporting);
    expect(resolveStoreShareCardDescription("  Handmade UK vintage  ")).toBe("Handmade UK vintage");
    const data = seller({ username: "plain", storeDescription: null });
    expect(data.storeDescription).toBeNull();
    expect(decodeURIComponent(buildStoreOgImageUrl(data).replace(/\+/g, " "))).toContain(
      STORE_SHARE_COPY.supporting,
    );
  });

  it("10–14. canonical URL + OG title/description/url/type", () => {
    const meta = sellerPageMetadata({
      username: "alpha-store",
      displayName: "Alpha Store",
      listingCount: 8,
      followersCount: 2,
    });
    expect(buildStoreUrl("alpha-store")).toBe("https://www.rovexo.co.uk/@alpha-store");
    expect(meta.openGraph?.title).toBe("alpha-store's Store on ROVEXO");
    expect(meta.openGraph?.description).toBe("Discover 8 items from alpha-store on ROVEXO.");
    expect(meta.openGraph?.url).toBe("https://www.rovexo.co.uk/@alpha-store");
    expect(meta.openGraph?.type).toBe("website");
    expect(meta.alternates?.canonical).toBe("https://www.rovexo.co.uk/@alpha-store");
    expect(buildStoreShareMetadata(seller({ username: "alpha-store" })).ogType).toBe("website");
  });

  it("15–16. OG image exists as public PNG", async () => {
    const data = seller({
      username: "alpha-store",
      displayName: "Alpha Store",
      followersCount: 2,
      activeListingsCount: 8,
    });
    const imageUrl = buildStoreOgImageUrl(data);
    expect(imageUrl.startsWith("https://www.rovexo.co.uk/api/seo/og?")).toBe(true);
    const page = sellerPageMetadata({ username: "alpha-store", listingCount: 8 });
    const image = Array.isArray(page.openGraph?.images) ? page.openGraph.images[0] : null;
    expect(image && typeof image === "object" && "type" in image ? image.type : "").toBe("image/png");

    const response = await ogGet(new Request(imageUrl.replace("https://www.rovexo.co.uk", "http://localhost")));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      true,
    );
  });

  it("17. Facebook desktop uses sharer.php with canonical Store URL", () => {
    const href = buildStoreFacebookShareUrl(buildStoreUrl("alpha-store"));
    expect(href).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://www.rovexo.co.uk/@alpha-store")}`,
    );
    expect(resolveStoreFacebookShareMode({ hasNativeShare: true, isMobileViewport: false })).toBe(
      "sharer",
    );
  });

  it("18–19. mobile Web Share payload + missing navigator.share fallback", () => {
    const payload = buildStoreShareNativePayload(
      seller({ username: "alpha-store", displayName: "Alpha Store" }),
    );
    expect(payload.title).toBe("Alpha Store's Store on ROVEXO");
    expect(payload.url).toBe("https://www.rovexo.co.uk/@alpha-store");
    expect(payload.text).toContain("ROVEXO");
    expect(isStoreShareMobileViewport(390)).toBe(true);
    expect(isStoreShareMobileViewport(1280)).toBe(false);
    expect(resolveStoreFacebookShareMode({ hasNativeShare: true, isMobileViewport: true })).toBe(
      "native",
    );
    expect(resolveStoreFacebookShareMode({ hasNativeShare: false, isMobileViewport: true })).toBe(
      "sharer",
    );
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("resolveStoreFacebookShareMode");
    expect(sheet).toContain("nativeShare()");
    expect(sheet).toContain("buildStoreFacebookShareUrl(data.storeUrl)");
  });

  it("20–23. WhatsApp, Telegram, Copy Link, QR unchanged", () => {
    const url = buildStoreUrl("alpha-store");
    expect(buildStoreWhatsAppShareUrl(url)).toContain("wa.me");
    expect(buildStoreWhatsAppShareUrl(url)).toContain(encodeURIComponent(url));
    expect(buildStoreTelegramShareUrl(url, buildStoreShareText(url))).toContain("t.me/share/url");
    expect(buildStoreTelegramShareUrl(url, buildStoreShareText(url))).toContain(encodeURIComponent(url));
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("store_share_copy_link");
    expect(sheet).toContain("data.storeUrl");
    expect(buildStoreQrTargetUrl("alpha-store")).toBe(url);
  });

  it("24. generated card params contain only public Store fields", () => {
    const data = seller({
      username: "alpha-store",
      storeDescription: "Handmade UK vintage",
      avatarUrl: "https://cdn.example.com/a.png",
    });
    const path = buildStoreOgImageUrl(data);
    expect(path).not.toMatch(/email|phone|address|inbox|wallet|stripe/i);
    const route = readSource("app/api/seo/og/route.ts");
    expect(route).not.toMatch(/email|phone|address|inbox|wallet/);
  });

  it("25–26. long username and description truncate without overflow", () => {
    const longName = "this-is-an-extremely-long-store-username-value";
    const longBio =
      "This is an extremely long store description that must never overflow the 1200 by 630 social card preview area.";
    expect(truncateStoreShareCardText(longName, 24).length).toBeLessThanOrEqual(24);
    expect(truncateStoreShareCardText(longName, 24).endsWith("…")).toBe(true);
    expect(resolveStoreShareCardDescription(longBio).length).toBeLessThanOrEqual(72);
    expect(formatStoreSharePublicHost(longName).startsWith("rovexo.co.uk/@")).toBe(true);
    expect(truncateStoreShareCardText(formatStoreSharePublicHost(longName), 36).length).toBeLessThanOrEqual(36);
    expect(formatStoreShareStatusLabel({ rating: null, reviewCount: 0 })).toBe(
      STORE_SHARE_COPY.newSellerOnRovexo,
    );
  });

  it("robots allow only the OG image API, not the whole /api/ tree", () => {
    const robots = readSource("app/robots.ts");
    expect(robots).toContain('"/api/seo/og"');
    expect(robots).toContain('"/api/"');
    expect(robots).not.toContain('allow: ["/api/"]');
  });
});
