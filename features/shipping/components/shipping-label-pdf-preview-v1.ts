/**
 * P7.26 UI — Rasterize existing shipping-label PDF bytes for inline preview.
 * Carrier-agnostic. Never generates labels. Never contacts Sendcloud.
 */

"use client";

export function canUseNativePdfIframePreview(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
  maxTouchPoints: number = typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0,
  platform: string = typeof navigator !== "undefined" ? navigator.platform : "",
): boolean {
  const ua = userAgent || "";
  const iOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
  // WKWebView (Safari + iOS Chrome) cannot paint PDF documents inside iframes.
  if (iOS) return false;
  return true;
}

/**
 * Render each page of an already-fetched PDF blob to PNG object URLs.
 * Returns null when rasterization is unavailable — caller shows compact fallback.
 */
export async function rasterizeShippingLabelPdfBlob(
  blob: Blob,
): Promise<string[] | null> {
  if (typeof window === "undefined") return null;
  if (!blob || blob.size === 0) return null;

  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const data = new Uint8Array(await blob.arrayBuffer());
    const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
    const pageCount = Math.min(doc.numPages || 1, 4);
    const urls: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      // Target ~720 CSS px wide for crisp mobile retina without huge memory.
      const scale = Math.min(2.5, Math.max(1.25, 720 / Math.max(base.width, 1)));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        page.cleanup();
        continue;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
      page.cleanup();
      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 0.92);
      });
      if (!pngBlob) continue;
      urls.push(URL.createObjectURL(pngBlob));
    }

    try {
      await doc.destroy();
    } catch {
      /* ignore */
    }

    return urls.length > 0 ? urls : null;
  } catch {
    return null;
  }
}

export function revokePreviewObjectUrls(urls: string[] | null | undefined): void {
  if (!urls?.length) return;
  for (const url of urls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}
