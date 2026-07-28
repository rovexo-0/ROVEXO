import { NextResponse } from "next/server";

/**
 * ROVEXO v1.0 — Demo shipping label presentation (canonical).
 * High-fidelity label document for the Shipping Label Viewer.
 * Fictional data only · DEMO watermark · never calls Sendcloud.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic pseudo-QR grid for demo presentation (not a scannable payload). */
function buildDemoQrSvg(seed: string, sizePx = 104): string {
  const cells = 21;
  const cell = sizePx / cells;
  const h = hashSeed(seed);
  const rects: string[] = [];

  const paintFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (edge || core) {
          rects.push(
            `<rect x="${((ox + x) * cell).toFixed(2)}" y="${((oy + y) * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#111"/>`,
          );
        }
      }
    }
  };

  paintFinder(0, 0);
  paintFinder(cells - 7, 0);
  paintFinder(0, cells - 7);

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const inFinder =
        (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
      if (inFinder) continue;
      const bit = (h ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263)) >>> 0;
      if (bit % 3 !== 0) {
        rects.push(
          `<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#111"/>`,
        );
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}" role="img" aria-label="Demo QR code">${rects.join("")}</svg>`;
}

/** Code39-style barcode bars from tracking characters (visual only). */
function buildDemoBarcodeSvg(tracking: string, width = 340, height = 54): string {
  const pattern: Record<string, string> = {
    "0": "nnnwwnwnn",
    "1": "wnnwnnnnw",
    "2": "nnwwnnnnw",
    "3": "wnwwnnnnn",
    "4": "nnnwwnnnw",
    "5": "wnnwwnnnn",
    "6": "nnwwwnnnn",
    "7": "nnnwnnwnw",
    "8": "wnnwnnwnn",
    "9": "nnwwnnwnn",
    A: "wnnnnwnnw",
    B: "nnwnnwnnw",
    C: "wnwnnwnnn",
    D: "nnnnwwnnw",
    E: "wnnnwwnnn",
    F: "nnwnwwnnn",
    G: "nnnnnwwnw",
    H: "wnnnnwwnn",
    I: "nnwnnwwnn",
    J: "nnnnwwwnn",
    K: "wnnnnnnww",
    L: "nnwnnnnww",
    M: "wnwnnnnwn",
    N: "nnnnwnnww",
    O: "wnnnwnnwn",
    P: "nnwnwnnwn",
    Q: "nnnnnnwww",
    R: "wnnnnnwwn",
    S: "nnwnnnwwn",
    T: "nnnnwnwwn",
    U: "wwnnnnnnw",
    V: "nwwnnnnnw",
    W: "wwwnnnnnn",
    X: "nwnnwnnnw",
    Y: "wwnnwnnnn",
    Z: "nwwnwnnnn",
    "-": "nwnnnnwnw",
    " ": "nwwnnnwnn",
    $: "nwnwnwnnn",
    "/": "nwnwnnnwn",
    "+": "nwnnnwnwn",
    "%": "nnnwnwnwn",
    "*": "nwnnwnwnn",
  };

  const payload = `*${tracking.replace(/[^A-Z0-9]/g, "").slice(0, 22)}*`;
  let units = 0;
  const runs: Array<{ narrow: boolean; bar: boolean }> = [];
  for (const ch of payload) {
    const seq = pattern[ch] ?? pattern["0"];
    for (let i = 0; i < seq.length; i += 1) {
      const narrow = seq[i] === "n";
      runs.push({ narrow, bar: i % 2 === 0 });
      units += narrow ? 1 : 3;
    }
    runs.push({ narrow: true, bar: false });
    units += 1;
  }

  const unitW = width / Math.max(units, 1);
  let x = 0;
  const rects: string[] = [];
  for (const run of runs) {
    const w = unitW * (run.narrow ? 1 : 3);
    if (run.bar) {
      rects.push(
        `<rect x="${x.toFixed(2)}" y="0" width="${Math.max(w, 0.6).toFixed(2)}" height="${height}" fill="#111"/>`,
      );
    }
    x += w;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Demo barcode">${rects.join("")}</svg>`;
}

function demoParties(tracking: string): {
  recipient: { name: string; line1: string; line2: string; city: string; postcode: string };
  sender: { name: string; line1: string; city: string; postcode: string };
  returnTo: { name: string; line1: string; city: string; postcode: string };
  parcelRef: string;
  marketplaceRef: string;
} {
  const n = hashSeed(tracking);
  const recipients = [
    {
      name: "Alex Morgan",
      line1: "14 Harbour Walk",
      line2: "Flat 2",
      city: "Bristol",
      postcode: "BS1 4DJ",
    },
    {
      name: "Jordan Lee",
      line1: "88 King Street",
      line2: "",
      city: "Manchester",
      postcode: "M2 4WU",
    },
    {
      name: "Sam Taylor",
      line1: "3 Victoria Quay",
      line2: "Apartment 12",
      city: "Edinburgh",
      postcode: "EH6 6QQ",
    },
  ] as const;
  const senders = [
    { name: "Northgate Trading Co.", line1: "Unit 7 Commerce Park", city: "Leeds", postcode: "LS10 1AB" },
    { name: "Riverside Goods Ltd", line1: "21 Northgate Road", city: "Birmingham", postcode: "B1 1AA" },
  ] as const;
  const sender = senders[n % senders.length];
  const suffix = (n % 9000) + 1000;
  return {
    recipient: recipients[n % recipients.length],
    sender,
    returnTo: sender,
    parcelRef: `PCL-${suffix}`,
    marketplaceRef: `RX-${String(n).slice(-8).padStart(8, "0")}`,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tracking = (searchParams.get("tracking") ?? "").trim().toUpperCase();
  const carrierRaw = (searchParams.get("carrier") ?? "Royal Mail").trim() || "Royal Mail";
  const serviceRaw =
    (searchParams.get("service") ?? "Tracked 48").trim().replace(/^Demo\s+/i, "") || "Tracked 48";

  if (!tracking || !/^RVXDEMO[A-Z0-9]+$/i.test(tracking)) {
    return NextResponse.json({ error: "Invalid demo tracking number." }, { status: 400 });
  }

  const carrier = escapeHtml(carrierRaw);
  const service = escapeHtml(serviceRaw);
  const trackingSafe = escapeHtml(tracking);
  const { recipient, sender, returnTo, parcelRef, marketplaceRef } = demoParties(tracking);
  const qr = buildDemoQrSvg(tracking, 100);
  const barcode = buildDemoBarcodeSvg(tracking, 340, 52);
  const weight = `${(0.4 + (hashSeed(tracking) % 26) / 10).toFixed(1)} kg`;
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${carrier} · ${service}</title>
  <style>
    @page { size: 100mm 150mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      color: #111;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }
    .label {
      position: relative;
      width: 92%;
      max-width: 92%;
      aspect-ratio: 100 / 150;
      max-height: 98%;
      background: #fff;
      border: 2px solid #111;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
    }
    .watermark {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      pointer-events: none;
      z-index: 8;
    }
    .watermark span {
      transform: rotate(-32deg);
      font-size: clamp(16px, 4.8vw, 26px);
      font-weight: 800;
      letter-spacing: 0.1em;
      color: rgb(185 28 28 / 0.18);
      text-align: center;
      line-height: 1.2;
      border: 2px solid rgb(185 28 28 / 0.18);
      padding: 12px 16px;
      text-transform: uppercase;
      max-width: 88%;
      white-space: pre-line;
    }
    .band {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      border-bottom: 2px solid #111;
      min-height: 56px;
    }
    .carrier-block {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 8px 12px;
      flex: 1;
    }
    .carrier {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .carrier-sub {
      margin-top: 2px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #4b5563;
    }
    .service-block {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      padding: 8px 12px;
      border-left: 2px solid #111;
      background: #111;
      color: #fff;
      min-width: 38%;
      text-align: right;
    }
    .service-block strong {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1.2;
    }
    .service-block span {
      margin-top: 2px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .grid {
      display: grid;
      grid-template-columns: 1.4fr 0.85fr;
      border-bottom: 2px solid #111;
      min-height: 38%;
    }
    .block { padding: 10px 12px; }
    .block.qr {
      border-left: 1px solid #111;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #fafafa;
    }
    .block.qr svg {
      display: block;
      border: 1px solid #111;
      padding: 3px;
      background: #fff;
    }
    .kicker {
      margin: 0 0 4px;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #6b7280;
    }
    .name {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      line-height: 1.2;
    }
    .line {
      margin: 2px 0 0;
      font-size: 11px;
      line-height: 1.35;
    }
    .postcode {
      margin-top: 6px;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.08em;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 2px solid #111;
    }
    .meta .cell {
      padding: 8px 10px;
      border-right: 1px solid #d1d5db;
      min-height: 72px;
    }
    .meta .cell:nth-child(2n) { border-right: none; }
    .meta .cell:nth-child(n+3) { border-top: 1px solid #d1d5db; }
    .meta .cell p {
      margin: 0;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b7280;
    }
    .meta .cell span {
      display: block;
      margin-top: 3px;
      font-size: 10px;
      font-weight: 600;
      line-height: 1.35;
      color: #111;
    }
    .track {
      padding: 10px 12px 12px;
      text-align: center;
    }
    .track .kicker { margin-bottom: 2px; }
    .track-number {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.1em;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .barcode {
      display: flex;
      justify-content: center;
    }
    .barcode svg { max-width: 100%; height: auto; }
    @media print {
      body { background: #fff; }
      .page { padding: 0; width: 100%; }
      .label { box-shadow: none; min-height: 0; aspect-ratio: auto; height: 100vh; border-width: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <article class="label" aria-label="Shipping label">
      <div class="watermark" aria-hidden="true">
        <span>DEMO
NOT VALID FOR SHIPPING</span>
      </div>
      <header class="band">
        <div class="carrier-block">
          <div class="carrier">${carrier}</div>
          <div class="carrier-sub">UK Domestic</div>
        </div>
        <div class="service-block">
          <strong>${service}</strong>
          <span>Signed for</span>
        </div>
      </header>
      <section class="grid">
        <div class="block">
          <p class="kicker">Deliver to</p>
          <p class="name">${escapeHtml(recipient.name)}</p>
          <p class="line">${escapeHtml(recipient.line1)}</p>
          ${recipient.line2 ? `<p class="line">${escapeHtml(recipient.line2)}</p>` : ""}
          <p class="line">${escapeHtml(recipient.city)}</p>
          <p class="postcode">${escapeHtml(recipient.postcode)}</p>
        </div>
        <div class="block qr">
          ${qr}
          <p class="kicker" style="margin:0">Parcel ID</p>
        </div>
      </section>
      <section class="meta">
        <div class="cell">
          <p>Sender</p>
          <span>${escapeHtml(sender.name)}<br/>${escapeHtml(sender.line1)}<br/>${escapeHtml(sender.city)} ${escapeHtml(sender.postcode)}</span>
        </div>
        <div class="cell">
          <p>Return address</p>
          <span>${escapeHtml(returnTo.name)}<br/>${escapeHtml(returnTo.line1)}<br/>${escapeHtml(returnTo.city)} ${escapeHtml(returnTo.postcode)}</span>
        </div>
        <div class="cell">
          <p>Parcel reference</p>
          <span>${escapeHtml(parcelRef)}<br/>Weight ${escapeHtml(weight)}<br/>${escapeHtml(date)}</span>
        </div>
        <div class="cell">
          <p>Marketplace reference</p>
          <span>${escapeHtml(marketplaceRef)}<br/>Service ${service}</span>
        </div>
      </section>
      <section class="track">
        <p class="kicker">Tracking number</p>
        <p class="track-number">${trackingSafe}</p>
        <div class="barcode">${barcode}</div>
      </section>
    </article>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-ROVEXO-Label-Mode": "demo",
    },
  });
}
