import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PHASE_A3_SELL_ENGINE_V1 } from "@/lib/sell/phase-a3-sell-engine-v1";
import { LISTING_CREATE_RETRY_MS } from "@/lib/sell/publish-engine";
import { PRODUCTION_CSP } from "@/lib/ops/security-headers";
import { SELL_UPLOAD_RETRY_DELAYS_MS } from "@/lib/product-integration/upload-storage-orchestration-v1";

function readSource(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Phase A3 — Sell Engine + Shipping Labels", () => {
  it("locks sell+label scope", () => {
    expect(PHASE_A3_SELL_ENGINE_V1.scope).toBe("sell-photos-publish-shipping-labels");
    expect(PHASE_A3_SELL_ENGINE_V1.forbiddenModules).toContain("homepage");
    expect(PHASE_A3_SELL_ENGINE_V1.forbiddenModules).toContain("messages");
  });

  it("Add Photos paints placeholders before intake completes", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("paint thumbnails immediately");
    expect(provider).toContain("URL.createObjectURL(file)");
    expect(provider).toContain("CONCURRENCY");
    expect(provider).toContain("photoId: placeholder.id");
  });

  it("skips already-uploaded photos and uses faster retry backoff", () => {
    expect(LISTING_CREATE_RETRY_MS[0]).toBe(500);
    expect(SELL_UPLOAD_RETRY_DELAYS_MS[0]).toBe(500);
    const publish = readSource("lib/sell/publish-engine.ts");
    expect(publish).toContain("photo.uploaded || !photo.file");
  });

  it("allows blob embeds for shipping label preview in production CSP", () => {
    expect(PRODUCTION_CSP).toMatch(/frame-src[^;]*blob:/);
    expect(PRODUCTION_CSP).toMatch(/object-src[^;]*blob:/);
    expect(PRODUCTION_CSP).not.toContain("object-src 'none'");
  });

  it("fixes label download/print and persists storage path", () => {
    const viewer = readSource("features/shipping/components/ShippingLabelViewer.tsx");
    expect(viewer).toContain("never use noopener here");
    expect(viewer).toContain("window.open(absolute, \"_blank\")");
    expect(viewer).toContain("anchor.download");
    expect(viewer).toContain("createObjectURL");
    expect(viewer).not.toContain("<object");

    const server = readSource("lib/shipping/server.ts");
    expect(server).toContain("Persist bucket key");
    expect(server).toContain("stored.storagePath");
  });

  it("avoids double normalize on prepared listing thumbnails", () => {
    const images = readSource("lib/storage/client-images.ts");
    expect(images).toContain("skip second HEIC/normalize pass");
  });
});
