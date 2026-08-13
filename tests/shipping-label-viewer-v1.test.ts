import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  canUseNativePdfIframePreview,
  revokePreviewObjectUrls,
} from "@/features/shipping/components/shipping-label-pdf-preview-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Shipping Label Viewer v1.0", () => {
  it("provides a canonical viewer that embeds official labels without regenerating", () => {
    const viewer = readSource("features/shipping/components/ShippingLabelViewer.tsx");
    const css = readSource("styles/rovexo/shipping-label-viewer-v1.css");
    expect(viewer).toContain('data-shipping-label-viewer="v1.0"');
    expect(viewer).toContain("Official Carrier PDF");
    expect(viewer).toContain("Print / Share");
    expect(viewer).toContain("Download");
    expect(viewer).toContain("Loading shipping label...");
    expect(viewer).toContain("createObjectURL");
    expect(viewer).toContain("looksLikeHtml");
    expect(viewer).toContain('demo-label") ? "no-store"');
    expect(viewer).toContain("isSinglePage");
    expect(viewer).toContain("Shipping label unavailable.");
    expect(viewer).toContain("application/pdf");
    expect(viewer).toContain("view=FitH");
    expect(viewer).toContain("Open label");
    expect(viewer).toContain("rasterizeShippingLabelPdfBlob");
    expect(viewer).toContain("navigator.canShare");
    expect(viewer).toContain("window.open(absolute");
    expect(viewer).not.toContain("If the label preview is blank");
    expect(css).toContain(".slv-v1__pdf-fallback");
    expect(css).toContain('data-slv-mode="compact"');
    expect(css).toContain("no giant blank white preview stage");
    expect(viewer).not.toContain("generateShippingLabel");
    expect(viewer).not.toContain('method: "POST"');
    expect(css).toContain(".slv-v1__shell");
    expect(css).toContain(".slv-v1__spinner");
    expect(css).toContain("background: #ffffff");
    expect(css).toContain("0 2px 10px rgba(0, 0, 0, 0.06)");
    expect(css).toContain("width: 96%");
    expect(css).not.toContain(".slv-v1__carrier");
    expect(viewer).not.toContain("slv-v1__carrier");
    expect(viewer).toContain("scrollPanel={false}");
    expect(css).toContain("content: none !important");
    expect(css).toContain("No decorative side rails");
  });

  it("opens the viewer from Conversation Hub View instead of raw PDF tabs", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("ShippingLabelViewer");
    expect(hub).toContain("setLabelViewer");
    expect(hub).toContain('"view_label"');
    const viewLabelBlock = hub.slice(
      hub.indexOf('if (actionId === "view_label")'),
      hub.indexOf('if (actionId === "print_label"'),
    );
    expect(viewLabelBlock).not.toContain("window.open");
  });

  it("disables native PDF iframe preview on iOS WKWebView", () => {
    expect(canUseNativePdfIframePreview("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      false,
    );
    expect(
      canUseNativePdfIframePreview(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        5,
        "MacIntel",
      ),
    ).toBe(false);
    expect(
      canUseNativePdfIframePreview(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(true);
  });

  it("exposes preview URL revoke helper without shipping backend imports", () => {
    const preview = readSource(
      "features/shipping/components/shipping-label-pdf-preview-v1.ts",
    );
    expect(preview).toContain("rasterizeShippingLabelPdfBlob");
    expect(preview).not.toContain("sendcloud");
    expect(preview).not.toContain("generateShippingLabel");
    expect(preview).not.toContain("label-storage");
    revokePreviewObjectUrls([]);
    revokePreviewObjectUrls(null);
  });
});
