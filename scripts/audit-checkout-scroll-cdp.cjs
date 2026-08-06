/**
 * Checkout scroll CDP audit — runs on Windows Node against Windows Chrome CDP.
 * Writes: test-results/checkout-scroll-runtime-audit.json
 */
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CDP runner for Windows Node */
const fs = require("fs");
const path = require("path");

const CDP_HOST = process.env.CDP_HOST || "127.0.0.1";
const CDP_PORT = process.env.CDP_PORT || "9333";
const BASE = process.env.AUDIT_BASE_URL || "http://127.0.0.1:3000";
const BUYER_EMAIL = "demo.buyer@rovexo.co.uk";
const BUYER_PASSWORD = process.env.DEMO_BUYER_PASSWORD || "RovexoBuyer@2026";
const SELLER_EMAIL = "demo.seller@rovexo.co.uk";

function loadEnv() {
  const roots = [
    process.cwd(),
    // when launched from Windows against WSL path
    path.resolve(__dirname, ".."),
  ];
  for (const root of roots) {
    for (const file of [".env.local", ".env"]) {
      const p = path.join(root, file);
      if (!fs.existsSync(p)) continue;
      for (const line of fs.readFileSync(p, "utf8").split("\n")) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!m || process.env[m[1]]) continue;
        let v = m[2].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    }
  }
}

loadEnv();

async function cdpHttp(pathname) {
  const res = await fetch(`http://${CDP_HOST}:${CDP_PORT}${pathname}`);
  if (!res.ok) throw new Error(`CDP HTTP ${pathname}: ${res.status}`);
  return res.json();
}

function createCdpClient(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.addEventListener("open", () => {
      resolve({
        async send(method, params = {}) {
          const msgId = ++id;
          const payload = { id: msgId, method, params };
          return new Promise((res, rej) => {
            pending.set(msgId, { res, rej });
            ws.send(JSON.stringify(payload));
          });
        },
        close() {
          ws.close();
        },
      });
    });
    ws.addEventListener("message", (ev) => {
      const data = JSON.parse(String(ev.data));
      if (data.id && pending.has(data.id)) {
        const { res, rej } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) rej(new Error(JSON.stringify(data.error)));
        else res(data.result);
      }
    });
    ws.addEventListener("error", (err) => reject(err));
  });
}

async function signInSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase env");
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: BUYER_EMAIL, password: BUYER_PASSWORD }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`auth failed: ${JSON.stringify(body)}`);
  return body;
}

async function resolveCheckoutPath(accessToken) {
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let slug = null;
  if (url && service) {
    const sellerRes = await fetch(
      `${url}/rest/v1/profiles?email=eq.${encodeURIComponent(SELLER_EMAIL)}&select=id`,
      {
        headers: {
          apikey: service,
          Authorization: `Bearer ${service}`,
        },
      },
    );
    const sellers = await sellerRes.json();
    const sellerId = sellers?.[0]?.id;
    if (sellerId) {
      const prodRes = await fetch(
        `${url}/rest/v1/products?seller_id=eq.${sellerId}&status=eq.published&stock=gt.0&select=slug&order=updated_at.desc&limit=1`,
        {
          headers: {
            apikey: service,
            Authorization: `Bearer ${service}`,
          },
        },
      );
      const products = await prodRes.json();
      slug = products?.[0]?.slug || null;
    }
  }
  if (!slug) throw new Error("No published product slug");

  const buy = await fetch(`${BASE}/api/checkout/buy-now`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: "", // set below via browser cookies; use Authorization if API accepts
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ productSlug: slug }),
  });
  // Prefer browser-side buy-now after cookies set — return slug for now
  return { slug };
}

const AUDIT_FN = `(() => {
  const props = ${JSON.stringify([
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
  ])};
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;
  function nodeInfo(el) {
    if (!el || el.nodeType !== 1) return null;
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const cls =
      el.className && typeof el.className === "string"
        ? "." + el.className.trim().split(/\\s+/).slice(0, 8).join(".")
        : "";
    const extras = [];
    for (const a of ["data-app-shell","data-checkout-freeze","data-rx-scroll-page","data-full-width-engine"]) {
      if (el.hasAttribute(a)) extras.push("[" + a + '="' + el.getAttribute(a) + '"]');
    }
    const styles = {};
    for (const p of props) styles[p] = cs[p];
    return {
      path: (tag + id + cls + extras.join("")).slice(0, 220),
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      offsetHeight: el.offsetHeight,
      scrollTop: el.scrollTop,
      canScrollInternally: el.scrollHeight > el.clientHeight + 2,
      box: { w: Math.round(box.width), h: Math.round(box.height), top: Math.round(box.top), bottom: Math.round(box.bottom) },
      styles,
    };
  }
  const chain = [];
  const htmlInfo = nodeInfo(document.documentElement);
  const bodyInfo = nodeInfo(document.body);
  if (htmlInfo) chain.push(htmlInfo);
  if (bodyInfo) chain.push(bodyInfo);
  const leaf = document.querySelector(".ckt-v1__sections") || document.querySelector(".ckt-v1__main") || document.querySelector(".ckt-v1");
  const up = [];
  let cur = leaf;
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
  for (const el of [document.documentElement, document.body, document.querySelector(".checkout-v1-shell"), document.querySelector(".ckt-v1"), document.querySelector(".ckt-v1__main"), document.querySelector("main")].filter(Boolean)) {
    const before = el.scrollTop;
    el.scrollTop = before + 600;
    scrollAttempts.push({
      path: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(/\\s+/).slice(0, 4).join(".") : ""),
      before, after: el.scrollTop, moved: el.scrollTop > before + 2,
      scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
    });
    el.scrollTop = before;
  }
  window.scrollTo(0, beforeY);
  const blockers = [];
  for (const node of chain) {
    const reasons = [];
    const s = node.styles;
    if (s.overflowY === "hidden" || s.overflow === "hidden") reasons.push("overflow:hidden");
    if (s.touchAction === "none") reasons.push("touch-action:none");
    if (s.position === "fixed" && node.box.h >= viewportH - 4 && node.box.top <= 2) reasons.push("position:fixed full-viewport");
    if ((String(s.height).endsWith("vh") || String(s.height).endsWith("dvh") || (node.clientHeight >= viewportH - 2 && node.clientHeight <= viewportH + 2 && s.height !== "auto")) && (s.overflowY === "hidden" || s.overflowY === "clip" || s.overflow === "hidden")) {
      reasons.push("viewport-locked height + clipped overflow");
    }
    if (reasons.length) blockers.push({ path: node.path, reasons, styles: s, box: node.box, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight });
  }
  // FIRST element where document scroll is prevented: find nearest scrollport that is clipped
  let firstPreventer = null;
  for (const node of chain) {
    const s = node.styles;
    const clipped = s.overflowY === "hidden" || s.overflow === "hidden" || s.overflowY === "clip";
    const tallParent = node.clientHeight > 0 && node.clientHeight <= viewportH + 2;
    const childTaller = node.scrollHeight > node.clientHeight + 8;
    if (clipped && (childTaller || (tallParent && node.scrollHeight >= node.clientHeight))) {
      firstPreventer = { path: node.path, reasons: ["FIRST clipped ancestor"], styles: s, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight, box: node.box };
      break;
    }
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
      beforeY, afterWindowScroll: afterWindow,
      windowMoved: afterWindow > beforeY + 2,
    },
    chain, footer: nodeInfo(document.querySelector(".ckt-v1__footer")),
    largeFixedOverlays: overlays.slice(0, 10).map(nodeInfo),
    scrollAttempts, dialogOpen: Boolean(document.querySelector('[role="dialog"]')),
    blockers, firstPreventer,
  };
})()`;

async function main() {
  const session = await signInSupabase();
  const { slug } = await resolveCheckoutPath(session.access_token);

  // Create a fresh page via CDP
  const version = await cdpHttp("/json/version");
  const browserWs = version.webSocketDebuggerUrl;
  const browser = await createCdpClient(browserWs);
  const { targetId } = await browser.send("Target.createTarget", {
    url: "about:blank",
  });
  const { targetInfos } = await browser.send("Target.getTargets");
  const pageTarget = targetInfos.find((t) => t.targetId === targetId);
  if (!pageTarget) throw new Error("No page target");
  // Attach
  const { sessionId } = await browser.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  // With flatten, use page websocket from /json/list
  const list = await cdpHttp("/json/list");
  const pageEntry = list.find((t) => t.id === targetId) || list.find((t) => t.type === "page" && t.url === "about:blank");
  if (!pageEntry) throw new Error("page entry missing");
  browser.close();

  const page = await createCdpClient(pageEntry.webSocketDebuggerUrl);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Network.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await page.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await page.send("Emulation.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  // Inject Supabase auth cookies for Next SSR
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = encodeURIComponent(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: "bearer",
      user: session.user,
    }),
  );
  // chunked cookie pattern used by @supabase/ssr — also set base name
  await page.send("Network.setCookie", {
    name: cookieName,
    value: cookieValue,
    url: BASE,
    path: "/",
  });
  await page.send("Network.setCookie", {
    name: "rovexo_cookie_consent_v1",
    value: "accepted",
    url: BASE,
    path: "/",
  });

  // Navigate home first to hydrate session storage
  await page.send("Page.navigate", { url: `${BASE}/` });
  await new Promise((r) => setTimeout(r, 2500));
  await page.send("Runtime.evaluate", {
    expression: `(() => {
      const payload = ${JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: "bearer",
        user: session.user,
      })};
      try {
        localStorage.setItem(${JSON.stringify(cookieName)}, JSON.stringify(payload));
        localStorage.setItem("rovexo_cookie_consent_v1", "accepted");
      } catch (e) {}
      return true;
    })()`,
    returnByValue: true,
  });

  // Buy Now via page fetch (cookies/session)
  const buyResult = await page.send("Runtime.evaluate", {
    expression: `fetch(${JSON.stringify(`${BASE}/api/checkout/buy-now`)}, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productSlug: ${JSON.stringify(slug)} }),
    }).then(r => r.json()).then(j => JSON.stringify(j)).catch(e => JSON.stringify({ error: String(e) }))`,
    awaitPromise: true,
    returnByValue: true,
  });
  const buyBody = JSON.parse(buyResult.result.value);
  console.log("buy-now", buyBody);
  const checkoutPath =
    buyBody.checkoutPath ||
    (buyBody.checkoutSessionId
      ? `/checkout/${slug}?cs=${encodeURIComponent(buyBody.checkoutSessionId)}`
      : null);
  if (!checkoutPath) throw new Error("buy-now failed: " + JSON.stringify(buyBody));

  await page.send("Page.navigate", { url: `${BASE}${checkoutPath}` });
  await new Promise((r) => setTimeout(r, 4000));

  // Wait for checkout root
  for (let i = 0; i < 20; i++) {
    const ready = await page.send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector("[data-checkout-freeze='CHECKOUT_UI_v1.0']") || document.querySelector(".ckt-v1"))`,
      returnByValue: true,
    });
    if (ready.result.value) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  const audited = await page.send("Runtime.evaluate", {
    expression: AUDIT_FN,
    returnByValue: true,
    awaitPromise: false,
  });
  const report = audited.result.value;
  const outDir = path.resolve(__dirname, "..", "test-results");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "checkout-scroll-runtime-audit.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log("WROTE", outPath);
  console.log(
    JSON.stringify(
      {
        url: report.url,
        hasCkt: report.hasCkt,
        bodyLocked: report.bodyLocked,
        docScroll: report.docScroll,
        firstPreventer: report.firstPreventer,
        blockers: report.blockers,
        scrollAttempts: report.scrollAttempts,
        chainSummary: report.chain.map((n) => ({
          path: n.path,
          box: n.box,
          scroll: `${n.scrollHeight}/${n.clientHeight}`,
          position: n.styles.position,
          height: n.styles.height,
          minHeight: n.styles.minHeight,
          maxHeight: n.styles.maxHeight,
          overflow: n.styles.overflow,
          overflowY: n.styles.overflowY,
          display: n.styles.display,
          flex: n.styles.flex,
          touchAction: n.styles.touchAction,
          overscrollBehaviorY: n.styles.overscrollBehaviorY,
        })),
        largeFixedOverlays: report.largeFixedOverlays,
        footer: report.footer,
      },
      null,
      2,
    ),
  );
  page.close();
}

main().catch((err) => {
  console.error("AUDIT_FAILED", err);
  process.exit(1);
});
