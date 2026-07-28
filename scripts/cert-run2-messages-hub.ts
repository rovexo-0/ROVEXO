import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { signInWithSessionCookies } from "../e2e/helpers/auth";

const ORIGIN = "http://localhost:3000";
const OUT = join(process.cwd(), "test-results/run2-ui-comparison");
const VIEWPORT = { width: 440, height: 956 };

function padCss(pad: 24 | 9) {
  return `html[data-run2-ui-compare="${pad}"]{--fw-pad-x:${pad}px!important;--conv-pad-x:${pad}px!important;--cds-space-page-x:${pad}px!important;--uv1-inner-padding:${pad}px!important;}
html[data-run2-ui-compare="${pad}"] .conv-hub,html[data-run2-ui-compare="${pad}"] .conversation-hub,html[data-run2-ui-compare="${pad}"] .cds-layout__content--account-canonical{padding-left:${pad}px!important;padding-right:${pad}px!important;}
html[data-run2-ui-compare="${pad}"] .cds-layout__header{padding-left:${pad}px!important;padding-right:${pad}px!important;}`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => localStorage.setItem("rovexo_cookie_consent_v1", "accepted"));
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded" });
  await signInWithSessionCookies(page, {
    email: "demo.buyer@rovexo.co.uk",
    password: "RovexoBuyer@2026",
    baseURL: ORIGIN,
  });

  await page.goto(`${ORIGIN}/inbox`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /messages/i }).click().catch(() => undefined);
  await page.waitForTimeout(1500);

  const api = await page.evaluate(async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as {
      conversations?: Array<{ id?: string; conversationId?: string; conversation_id?: string }>;
    };
    return { ok: res.ok, conversations: json.conversations ?? [] };
  });

  let path = "/inbox";
  const first = api.conversations[0];
  const id = first?.id || first?.conversationId || first?.conversation_id;
  if (id) path = `/inbox/conversation/${id}`;
  console.log("messages-hub path", path, "count", api.conversations.length);

  await page.goto(`${ORIGIN}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  for (const pad of [24, 9] as const) {
    await page.evaluate((p) => document.documentElement.setAttribute("data-run2-ui-compare", String(p)), pad);
    await page.addStyleTag({ content: padCss(pad) });
    await page.waitForTimeout(300);
    const file = join(OUT, pad === 24 ? "a-24px" : "b-9px", "messages-hub.png");
    await page.screenshot({ path: file, fullPage: false });
    await sharp(file)
      .png()
      .toFile(join(OUT, "fullscreen", `messages-hub-${pad === 24 ? "a-24px" : "b-9px"}.png`));
  }

  const aPath = join(OUT, "a-24px", "messages-hub.png");
  const bPath = join(OUT, "b-9px", "messages-hub.png");
  const gap = 16;
  const labelH = 36;
  const w = 440;
  const h = 956;
  const aImg = await sharp(aPath).resize(w, h).png().toBuffer();
  const bImg = await sharp(bPath).resize(w, h).png().toBuffer();
  const labelA = Buffer.from(
    `<svg width="${w}" height="${labelH}"><rect width="100%" height="100%" fill="#111"/><text x="12" y="24" fill="#fff" font-family="system-ui" font-size="14">A · Current 24px</text></svg>`,
  );
  const labelB = Buffer.from(
    `<svg width="${w}" height="${labelH}"><rect width="100%" height="100%" fill="#5b21b6"/><text x="12" y="24" fill="#fff" font-family="system-ui" font-size="14">B · Prototype 9px</text></svg>`,
  );
  const side = join(OUT, "side-by-side", "messages-hub.png");
  await sharp({
    create: {
      width: w * 2 + gap,
      height: h + labelH,
      channels: 4,
      background: { r: 240, g: 240, b: 245, alpha: 1 },
    },
  })
    .composite([
      { input: labelA, left: 0, top: 0 },
      { input: labelB, left: w + gap, top: 0 },
      { input: aImg, left: 0, top: labelH },
      { input: bImg, left: w + gap, top: labelH },
    ])
    .png()
    .toFile(side);
  await sharp(side).toFile(join(OUT, "split", "messages-hub.png"));

  // pixel overlay refresh
  const a = sharp(aPath);
  const { width = w, height = h } = await a.metadata();
  const aBuf = await a.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bBuf = await sharp(bPath).resize(width, height).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const overlay = Buffer.alloc(aBuf.data.length);
  for (let i = 0; i < aBuf.data.length; i += 4) {
    const delta =
      (Math.abs(aBuf.data[i]! - bBuf.data[i]!) +
        Math.abs(aBuf.data[i + 1]! - bBuf.data[i + 1]!) +
        Math.abs(aBuf.data[i + 2]! - bBuf.data[i + 2]!)) /
      3;
    const hit = delta > 8;
    const g = Math.round((aBuf.data[i]! + aBuf.data[i + 1]! + aBuf.data[i + 2]!) / 3);
    overlay[i] = hit ? 255 : g;
    overlay[i + 1] = hit ? 0 : g;
    overlay[i + 2] = hit ? 180 : g;
    overlay[i + 3] = 255;
  }
  await sharp(overlay, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(join(OUT, "overlay", "messages-hub.png"));
  await sharp(overlay, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(join(OUT, "diff", "messages-hub.png"));

  for (const factor of [2, 4] as const) {
    for (const sideName of ["a", "b"] as const) {
      const src = sideName === "a" ? aPath : bPath;
      const meta = await sharp(src).metadata();
      const sw = meta.width ?? w;
      const sh = meta.height ?? h;
      const cw = Math.floor(sw / factor);
      const ch = Math.floor(sh / factor);
      const left = Math.floor((sw - cw) / 2);
      const top = Math.min(Math.floor(sh * 0.18), sh - ch);
      await sharp(src)
        .extract({ left, top, width: cw, height: ch })
        .resize(sw, sh, { kernel: "nearest" })
        .png()
        .toFile(join(OUT, `zoom-x${factor}`, `messages-hub-${sideName}.png`));
    }
  }

  const resultsPath = join(OUT, "results.json");
  const results = JSON.parse(readFileSync(resultsPath, "utf8")) as {
    pages: Array<{ id: string; path: string }>;
  };
  const row = results.pages.find((p) => p.id === "messages-hub");
  if (row) row.path = path;
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log("messages-hub recaptured", path);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
