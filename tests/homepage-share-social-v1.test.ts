import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  HOMEPAGE_SHARE,
  getHomepageFacebookShareUrl,
  getHomepageWhatsAppShareUrl,
  getHomepageXShareUrl,
  isCanonicalHomepageShareUrl,
} from "@/lib/share/homepage";
import { PRODUCTION_ORIGIN } from "@/lib/preview/owner-preview-ssot";

function read(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Homepage Share Social v1 — COD SÂNGE", () => {
  it("mounts Share Nodes icon with Share ROVEXO aria-label in homepage header", () => {
    const header = read("components/header/RovexoHeaderV2.tsx");
    const button = read("components/header/HomepageHeaderShareButton.tsx");
    const icons = read("components/icons/RvxLineIcons.tsx");

    expect(header).toContain("HomepageHeaderShareButton");
    expect(header).toContain("HomepageRegisteredUserCounter");
    expect(button).toContain("ShareNodesLineIcon");
    expect(button).toContain('aria-label="Share ROVEXO"');
    expect(button).toContain("navigator.share");
    expect(icons).toContain("ShareNodesLineIcon");
    expect(icons).toMatch(/export (?:function|const) ShareNodesLineIcon/);
  });

  it("uses production canonical homepage URL — never localhost or query/session params", () => {
    expect(HOMEPAGE_SHARE.url).toBe(`${PRODUCTION_ORIGIN}/`);
    expect(HOMEPAGE_SHARE.url).toBe("https://www.rovexo.co.uk/");
    expect(HOMEPAGE_SHARE.url).not.toContain("localhost");
    expect(HOMEPAGE_SHARE.url).not.toContain("127.0.0.1");
    expect(HOMEPAGE_SHARE.url).not.toContain("?");
    expect(HOMEPAGE_SHARE.url).not.toContain("#");
    expect(isCanonicalHomepageShareUrl(HOMEPAGE_SHARE.url)).toBe(true);
    expect(isCanonicalHomepageShareUrl("http://localhost:3000/")).toBe(false);
    expect(isCanonicalHomepageShareUrl("https://www.rovexo.co.uk/?ref=x")).toBe(false);
    expect(isCanonicalHomepageShareUrl("https://www.rovexo.co.uk/account")).toBe(false);
  });

  it("native share payload matches Owner copy", () => {
    expect(HOMEPAGE_SHARE.title).toBe("ROVEXO");
    expect(HOMEPAGE_SHARE.text).toBe("Buy • Sell • Grow");
    const button = read("components/header/HomepageHeaderShareButton.tsx");
    expect(button).toContain("title: HOMEPAGE_SHARE.title");
    expect(button).toContain("text: HOMEPAGE_SHARE.text");
    expect(button).toContain("url: HOMEPAGE_SHARE.url");
  });

  it("fallback menu exposes WhatsApp, Facebook, X, and Copy link only", () => {
    const button = read("components/header/HomepageHeaderShareButton.tsx");
    expect(button).toContain("WhatsApp");
    expect(button).toContain("Facebook");
    expect(button).toMatch(/>\s*X\s*</);
    expect(button).toContain("Copy link");
    expect(button).toContain("Link copied");
    expect(button).toContain("Escape");
    expect(button).toContain("closeMenu");
    expect(button).toContain("popstate");
    expect(button).not.toContain("Messenger");
    expect(button).not.toContain("Telegram");
    expect(button).not.toContain("Email");
    expect(button).not.toContain("More Apps");
    expect(button).not.toContain("ModalContainer");
  });

  it("builds social share URLs against the canonical homepage", () => {
    const url = HOMEPAGE_SHARE.url;
    expect(getHomepageWhatsAppShareUrl()).toContain(encodeURIComponent(url));
    expect(getHomepageWhatsAppShareUrl()).toContain("wa.me");
    expect(getHomepageFacebookShareUrl()).toContain(encodeURIComponent(url));
    expect(getHomepageFacebookShareUrl()).toContain("facebook.com/sharer");
    expect(getHomepageXShareUrl()).toContain(encodeURIComponent(url));
    expect(getHomepageXShareUrl()).toContain("twitter.com/intent/tweet");
  });

  it("freeze allowlist includes Share ROVEXO without restoring avatar/notifications", () => {
    const freeze = read("lib/header/header-master-freeze-v1.ts");
    expect(freeze).toContain("Share ROVEXO (Share Nodes)");
    expect(freeze).toContain("noAvatarInHeader");
    expect(freeze).toContain("noNotificationIcon");
  });
});
