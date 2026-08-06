/**
 * COD SÂNGE — Checkout scroll runtime audit (evidence only).
 * Finds FIRST ancestor that prevents vertical scrolling.
 */
import { expect, test, type Page } from "@playwright/test";
import { createAdminClient } from "../lib/supabase/admin";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import { signInWithSessionCookies } from "./helpers/auth";

const [BUYER, SELLER] = FULL_DEMO_ACCOUNTS;

const PROPS = [
  "display",
  "position",
  "height",
  "minHeight",
  "maxHeight",
  "overflow",
  "overflowX",
  "overflowY",
  "touchAction",
  "overscrollBehavior",
  "overscrollBehaviorY",
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "pointerEvents",
] as const;

async function auditCheckoutScroll(page: Page) {
  return page.evaluate((props) => {
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    function nodeInfo(el: Element | null) {
      if (!el || el.nodeType !== 1) return null;
      const htmlEl = el as HTMLElement;
      const cs = getComputedStyle(htmlEl);
      const box = htmlEl.getBoundingClientRect();
      const tag = htmlEl.tagName.toLowerCase();
      const id = htmlEl.id ? `#${htmlEl.id}` : "";
      const cls =
        htmlEl.className && typeof htmlEl.className === "string"
          ? "." + htmlEl.className.trim().split(/\s+/).slice(0, 8).join(".")
          : "";
      const extras: string[] = [];
      for (const a of [
        "data-app-shell",
        "data-checkout-freeze",
        "data-rx-scroll-page",
        "data-full-width-engine",
      ]) {
        if (htmlEl.hasAttribute(a)) extras.push(`[${a}="${htmlEl.getAttribute(a)}"]`);
      }
      const styles: Record<string, string> = {};
      for (const p of props) styles[p] = cs[p as keyof CSSStyleDeclaration] as string;
      return {
        path: `${tag}${id}${cls}${extras.join("")}`.slice(0, 220),
        scrollHeight: htmlEl.scrollHeight,
        clientHeight: htmlEl.clientHeight,
        offsetHeight: htmlEl.offsetHeight,
        scrollTop: htmlEl.scrollTop,
        canScrollInternally: htmlEl.scrollHeight > htmlEl.clientHeight + 2,
        box: {
          w: Math.round(box.width),
          h: Math.round(box.height),
          top: Math.round(box.top),
          bottom: Math.round(box.bottom),
        },
        styles,
      };
    }

    const chain: NonNullable<ReturnType<typeof nodeInfo>>[] = [];
    const htmlInfo = nodeInfo(document.documentElement);
    const bodyInfo = nodeInfo(document.body);
    if (htmlInfo) chain.push(htmlInfo);
    if (bodyInfo) chain.push(bodyInfo);

    const leaf =
      document.querySelector(".ckt-v1__sections") ||
      document.querySelector(".ckt-v1__main") ||
      document.querySelector(".ckt-v1");
    const up: NonNullable<ReturnType<typeof nodeInfo>>[] = [];
    let cur: Element | null = leaf;
    while (cur && cur !== document.documentElement) {
      const info = nodeInfo(cur);
      if (info) up.push(info);
      cur = cur.parentElement;
    }
    const seen = new Set(chain.map((n) => n.path));
    for (const n of up.reverse()) {
      if (seen.has(n.path)) continue;
      seen.add(n.path);
      chain.push(n);
    }

    const overlays = [...document.querySelectorAll("body *")].filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed" && cs.position !== "sticky") return false;
      const r = el.getBoundingClientRect();
      return r.height >= viewportH * 0.45 && r.width >= viewportW * 0.45;
    });

    const beforeY = window.scrollY || document.documentElement.scrollTop || 0;
    window.scrollBy(0, 500);
    document.documentElement.scrollTop = beforeY + 500;
    document.body.scrollTop = beforeY + 500;
    const afterWindow = window.scrollY || document.documentElement.scrollTop || 0;

    const scrollAttempts = [];
    for (const el of [
      document.documentElement,
      document.body,
      document.querySelector(".checkout-v1-shell"),
      document.querySelector(".ckt-v1"),
      document.querySelector(".ckt-v1__main"),
      document.querySelector("main"),
      document.querySelector("#main-content"),
    ].filter(Boolean) as HTMLElement[]) {
      const before = el.scrollTop;
      el.scrollTop = before + 600;
      scrollAttempts.push({
        path: `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(/\s+/).slice(0, 4).join(".") : ""}`,
        before,
        after: el.scrollTop,
        moved: el.scrollTop > before + 2,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        overflowY: getComputedStyle(el).overflowY,
      });
      el.scrollTop = before;
    }

    // Touch listener probe — any non-passive touchmove preventDefault on ancestors?
    const touchBlockersNoted = "n/a-static";

    window.scrollTo(0, beforeY);

    const blockers = [];
    for (const node of chain) {
      const reasons: string[] = [];
      const s = node.styles;
      if (s.overflowY === "hidden" || s.overflow === "hidden") reasons.push("overflow:hidden");
      if (s.touchAction === "none") reasons.push("touch-action:none");
      if (
        s.position === "fixed" &&
        node.box.h >= viewportH - 4 &&
        node.box.top <= 2
      ) {
        reasons.push("position:fixed full-viewport");
      }
      if (
        (String(s.height).endsWith("vh") ||
          String(s.height).endsWith("dvh") ||
          (node.clientHeight >= viewportH - 2 &&
            node.clientHeight <= viewportH + 2 &&
            s.height !== "auto" &&
            s.height !== "0px")) &&
        (s.overflowY === "hidden" || s.overflowY === "clip" || s.overflow === "hidden")
      ) {
        reasons.push("viewport-locked height + clipped overflow");
      }
      // nested scrollport that cannot scroll but clips
      if (
        node.canScrollInternally === false &&
        node.clientHeight >= viewportH - 2 &&
        (s.overflowY === "auto" || s.overflowY === "scroll") &&
        node.scrollHeight <= node.clientHeight + 2
      ) {
        // height locked equal to content viewport — may prevent document scroll if this is the only scrollport
        if (s.height !== "auto" || s.maxHeight !== "none") {
          reasons.push("bounded scrollport with no internal overflow (may trap document)");
        }
      }
      if (reasons.length) blockers.push({ path: node.path, reasons, styles: s, box: node.box });
    }

    return {
      url: location.href,
      viewport: { w: viewportW, h: viewportH },
      hasCkt: Boolean(document.querySelector(".ckt-v1")),
      bodyLocked: document.body.classList.contains("rx-scroll-locked"),
      htmlLocked: document.documentElement.classList.contains("rx-scroll-locked"),
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      bodyInline: document.body.getAttribute("style"),
      htmlInline: document.documentElement.getAttribute("style"),
      docScroll: {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        beforeY,
        afterWindowScroll: afterWindow,
        windowMoved: afterWindow > beforeY + 2,
      },
      chain,
      footer: nodeInfo(document.querySelector(".ckt-v1__footer")),
      largeFixedOverlays: overlays.slice(0, 10).map((el) => nodeInfo(el)),
      scrollAttempts,
      dialogOpen: Boolean(document.querySelector('[role="dialog"]')),
      blockers,
      touchBlockersNoted,
    };
  }, PROPS);
}

test.describe("Checkout scroll runtime audit", () => {
  test("audit ancestor chain + prove scroll blocker", async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    if (!baseURL) throw new Error("baseURL required");

    const hasServiceRole = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim(),
    );
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRole, "Needs secrets");

    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("email", [BUYER!.email, SELLER!.email]);
    const seller = profiles?.find((p) => p.email === SELLER!.email);
    expect(seller?.id).toBeTruthy();

    const { data: product } = await admin
      .from("products")
      .select("slug")
      .eq("seller_id", seller!.id)
      .eq("status", "published")
      .gt("stock", 0)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    test.skip(!product?.slug, "No product");

    await signInWithSessionCookies(page, {
      email: BUYER!.email,
      password: BUYER!.password ?? "",
      baseURL,
    });

    const buyNow = await page.request.post("/api/checkout/buy-now", {
      data: { productSlug: product!.slug },
    });
    expect(buyNow.ok(), await buyNow.text()).toBeTruthy();
    const body = (await buyNow.json()) as {
      checkoutSessionId?: string;
      checkoutPath?: string;
    };
    const path =
      body.checkoutPath ||
      `/checkout/${product!.slug}?cs=${encodeURIComponent(body.checkoutSessionId!)}`;

    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-checkout-freeze='CHECKOUT_UI_v1.0']")).toBeVisible({
      timeout: 45_000,
    });

    // iPhone-sized viewport already from project; also force compact height
    await page.setViewportSize({ width: 390, height: 664 });
    await page.waitForTimeout(500);

    const report = await auditCheckoutScroll(page);

    // Persist evidence for Owner
    const fs = await import("node:fs");
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync(
      "test-results/checkout-scroll-runtime-audit.json",
      JSON.stringify(report, null, 2),
    );

    console.log("\n=== CHECKOUT SCROLL AUDIT ===");
    console.log("URL:", report.url);
    console.log("viewport:", report.viewport);
    console.log("doc scrollHeight/clientHeight:", report.docScroll.scrollHeight, report.docScroll.clientHeight);
    console.log("windowMoved:", report.docScroll.windowMoved);
    console.log("bodyLocked:", report.bodyLocked, "dialogOpen:", report.dialogOpen);
    console.log("\n--- ANCESTOR CHAIN ---");
    for (const n of report.chain) {
      console.log(
        [
          n.path,
          `box=${n.box.w}x${n.box.h}`,
          `scroll=${n.scrollHeight}/${n.clientHeight}`,
          `pos=${n.styles.position}`,
          `h=${n.styles.height}`,
          `minH=${n.styles.minHeight}`,
          `maxH=${n.styles.maxHeight}`,
          `ov=${n.styles.overflow}`,
          `oy=${n.styles.overflowY}`,
          `disp=${n.styles.display}`,
          `flex=${n.styles.flex}`,
          `touch=${n.styles.touchAction}`,
          `overscroll=${n.styles.overscrollBehaviorY || n.styles.overscrollBehavior}`,
        ].join(" | "),
      );
    }
    console.log("\n--- SCROLL ATTEMPTS ---");
    console.log(JSON.stringify(report.scrollAttempts, null, 2));
    console.log("\n--- BLOCKERS ---");
    console.log(JSON.stringify(report.blockers, null, 2));
    console.log("\n--- FIXED OVERLAYS ---");
    console.log(JSON.stringify(report.largeFixedOverlays, null, 2));
    console.log("\n--- FOOTER ---");
    console.log(JSON.stringify(report.footer, null, 2));

    // Soft assertion: we always want evidence file; hard fail if page missing
    expect(report.hasCkt).toBe(true);
  });
});
