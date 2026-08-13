"use client";

/**
 * ROVEXO v1.0 — Shipping Label Viewer (CANONICAL)
 * Single presentation component for official carrier PDFs and demo labels.
 * Never recreates, redraws, or regenerates labels. No duplicate viewers.
 *
 * Fetches the existing label URL into a same-origin blob so the document
 * is visible even when carriers / storage block cross-origin iframes.
 * P7.26 UI: rasterize PDF pages for mobile preview (iframe PDF is blank on iOS).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ModalContainer } from "@/components/ui/ModalContainer";
import {
  canUseNativePdfIframePreview,
  rasterizeShippingLabelPdfBlob,
  revokePreviewObjectUrls,
} from "@/features/shipping/components/shipping-label-pdf-preview-v1";
import "@/styles/rovexo/shipping-label-viewer-v1.css";

const labelUrlCache = new Map<string, string>();

export type ShippingLabelViewerProps = {
  open: boolean;
  onClose: () => void;
  /** Existing signed / demo label URL from GET /api/shipping/labels — never generate here. */
  pdfUrl: string | null;
  orderId?: string | null;
  /** Optional; carrier appears inside the document — not duplicated in the header. */
  carrierName?: string | null;
};

export function getCachedShippingLabelUrl(orderId: string): string | null {
  return labelUrlCache.get(orderId) ?? null;
}

export function cacheShippingLabelUrl(orderId: string, url: string): void {
  if (orderId && url) labelUrlCache.set(orderId, url);
}

function resolveAbsoluteUrl(url: string): string {
  if (typeof window === "undefined") return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${window.location.origin}${url}`;
  }
  return url;
}

/**
 * P7.26 — Signed Supabase Storage PDFs use Access-Control-Allow-Origin: "*".
 * Browsers reject credentials:"include" against that header. Same-origin demo /
 * ROVEXO paths may still send cookies; cross-origin signed PDFs must omit them.
 * Never send ROVEXO session cookies to Supabase Storage.
 */
export function resolveShippingLabelFetchCredentials(
  absoluteUrl: string,
  origin: string | null | undefined = typeof window !== "undefined" ? window.location.origin : null,
): RequestCredentials {
  try {
    const parsed = new URL(absoluteUrl, origin || undefined);
    if (parsed.protocol === "blob:") return "omit";
    if (origin && parsed.origin === origin) return "include";
    return "omit";
  } catch {
    return "omit";
  }
}

export function ShippingLabelViewer({
  open,
  onClose,
  pdfUrl,
  orderId = null,
}: ShippingLabelViewerProps) {
  const objectUrlRef = useRef<string | null>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("application/pdf");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<"image" | "iframe" | "compact">("compact");
  const [page, setPage] = useState(1);
  const loadGeneration = useRef(0);

  const sourceUrl = pdfUrl?.trim() || null;
  const pageCount = previewUrls.length > 0 ? previewUrls.length : 1;

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const clearPreviewUrls = useCallback(() => {
    revokePreviewObjectUrls(previewUrlsRef.current);
    previewUrlsRef.current = [];
    setPreviewUrls([]);
  }, []);

  const loadLabel = useCallback(async () => {
    const generation = ++loadGeneration.current;
    revokeObjectUrl();
    clearPreviewUrls();
    setEmbedUrl(null);
    setPreviewMode("compact");
    setPage(1);

    if (!sourceUrl) {
      setLoadState("error");
      return;
    }

    if (orderId) cacheShippingLabelUrl(orderId, sourceUrl);
    setLoadState("loading");

    const absolute = resolveAbsoluteUrl(sourceUrl);

    try {
      const response = await fetch(absolute, {
        method: "GET",
        credentials: resolveShippingLabelFetchCredentials(absolute),
        cache: absolute.includes("demo-label") ? "no-store" : "force-cache",
      });
      if (!response.ok) throw new Error("label_fetch_failed");
      const blob = await response.blob();
      if (generation !== loadGeneration.current) return;
      if (!blob || blob.size === 0) throw new Error("label_empty");

      const head = (await blob.slice(0, 64).text()).trimStart().toLowerCase();
      const looksLikeHtml = head.startsWith("<!doctype") || head.startsWith("<html");
      const type = looksLikeHtml
        ? "text/html"
        : blob.type && blob.type !== "application/octet-stream"
          ? blob.type
          : absolute.toLowerCase().includes(".png")
            ? "image/png"
            : absolute.includes("demo-label")
              ? "text/html"
              : "application/pdf";
      const typedBlob =
        looksLikeHtml || !blob.type ? new Blob([blob], { type }) : blob;
      const objectUrl = URL.createObjectURL(typedBlob);
      objectUrlRef.current = objectUrl;
      setMimeType(type);
      setEmbedUrl(objectUrl);

      if (type.startsWith("image/") || type.includes("html")) {
        setPreviewMode(type.startsWith("image/") ? "image" : "iframe");
        setLoadState("ready");
        return;
      }

      // PDF — prefer rasterized pages so mobile Safari shows the real label (not a blank iframe).
      const raster = await rasterizeShippingLabelPdfBlob(typedBlob);
      if (generation !== loadGeneration.current) {
        revokePreviewObjectUrls(raster);
        return;
      }
      if (raster && raster.length > 0) {
        previewUrlsRef.current = raster;
        setPreviewUrls(raster);
        setPreviewMode("image");
        setLoadState("ready");
        return;
      }

      if (canUseNativePdfIframePreview()) {
        setPreviewMode("iframe");
        setLoadState("ready");
        return;
      }

      // Compact fallback — keep Open/Download/Print usable, no giant blank stage.
      setPreviewMode("compact");
      setLoadState("ready");
    } catch {
      if (generation !== loadGeneration.current) return;
      /*
       * Do not embed raw same-origin /api paths — global X-Frame-Options: DENY blanks iframes.
       * Keep error + Open/Download recovery instead of a false "ready" blank stage.
       */
      setLoadState("error");
    }
  }, [sourceUrl, orderId, revokeObjectUrl, clearPreviewUrls]);

  useEffect(() => {
    if (!open) {
      loadGeneration.current += 1;
      revokeObjectUrl();
      // Revoke only — avoid sync setState in this effect (React cascading-render rule).
      revokePreviewObjectUrls(previewUrlsRef.current);
      previewUrlsRef.current = [];
      return;
    }
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void loadLabel();
    });
    return () => {
      cancelled = true;
      loadGeneration.current += 1;
    };
  }, [open, loadLabel, revokeObjectUrl]);

  const viewLoadState = open ? loadState : "idle";
  const viewEmbedUrl = open ? embedUrl : null;
  const viewPage = open ? page : 1;

  useEffect(
    () => () => {
      revokeObjectUrl();
      clearPreviewUrls();
    },
    [revokeObjectUrl, clearPreviewUrls],
  );

  const handleRetry = useCallback(() => {
    void loadLabel();
  }, [loadLabel]);

  const handleOpenLabel = useCallback(() => {
    const href = embedUrl || sourceUrl;
    if (!href) return;
    window.open(resolveAbsoluteUrl(href), "_blank");
  }, [embedUrl, sourceUrl]);

  const handleDownload = useCallback(async () => {
    try {
      let blob: Blob | null = null;
      let type = mimeType;

      if (embedUrl?.startsWith("blob:")) {
        blob = await fetch(embedUrl).then((response) => response.blob());
      } else if (sourceUrl) {
        const absoluteDownload = resolveAbsoluteUrl(sourceUrl);
        const response = await fetch(absoluteDownload, {
          method: "GET",
          credentials: resolveShippingLabelFetchCredentials(absoluteDownload),
          cache: "no-store",
        });
        if (!response.ok) throw new Error("download_failed");
        blob = await response.blob();
        if (blob.type && blob.type !== "application/octet-stream") type = blob.type;
      }
      if (!blob || blob.size === 0) return;

      const extension = type.includes("png")
        ? "png"
        : type.includes("html")
          ? "html"
          : "pdf";
      const objectUrl = URL.createObjectURL(
        blob.type ? blob : new Blob([blob], { type: type || "application/pdf" }),
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `rovexo-shipping-label.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);
    } catch {
      /* fail closed — keep viewer usable */
    }
  }, [embedUrl, sourceUrl, mimeType]);

  const handlePrintShare = useCallback(async () => {
    const href = embedUrl || sourceUrl;
    if (!href) return;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        if (embedUrl?.startsWith("blob:")) {
          const blob = await fetch(embedUrl).then((response) => response.blob());
          const extension = mimeType.includes("png")
            ? "png"
            : mimeType.includes("html")
              ? "html"
              : "pdf";
          const file = new File([blob], `rovexo-shipping-label.${extension}`, {
            type: mimeType || blob.type || "application/pdf",
          });
          if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Shipping Label" });
            return;
          }
        }
        if (sourceUrl) {
          await navigator.share({
            title: "Shipping Label",
            url: resolveAbsoluteUrl(sourceUrl),
          });
          return;
        }
      } catch {
        /* user cancelled or share unsupported — fall through */
      }
    }

    if (mimeType.includes("html")) {
      try {
        const printFrame = document.querySelector<HTMLIFrameElement>(".slv-v1__frame");
        if (printFrame?.contentWindow) {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
          return;
        }
      } catch {
        /* cross-origin / blocked */
      }
    }

    /*
     * Phase A3 — never use noopener here: modern browsers return null and print never runs.
     * Prefer the in-memory blob URL so print opens the exact fetched PDF bytes.
     */
    const absolute = resolveAbsoluteUrl(embedUrl || sourceUrl || href);
    const printWindow = window.open(absolute, "_blank");
    if (printWindow) {
      const triggerPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          /* user can print from the opened tab */
        }
      };
      printWindow.addEventListener("load", triggerPrint, { once: true });
      window.setTimeout(triggerPrint, 750);
      return;
    }

    void handleDownload();
  }, [embedUrl, sourceUrl, mimeType, handleDownload]);

  const pdfSrc =
    viewEmbedUrl && mimeType.includes("pdf")
      ? `${viewEmbedUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`
      : viewEmbedUrl;

  const isImage = mimeType.startsWith("image/");
  const isHtml = mimeType.includes("html");
  const showDocument = viewLoadState === "ready" && Boolean(viewEmbedUrl);
  const showRasterPreview = showDocument && previewMode === "image" && previewUrls.length > 0;
  const showNativeImage = showDocument && isImage && previewUrls.length === 0;
  const showHtmlFrame = showDocument && isHtml;
  const showPdfIframe = showDocument && previewMode === "iframe" && !isImage && !isHtml;
  const showCompactFallback = showDocument && previewMode === "compact" && !isImage && !isHtml;
  const showError =
    viewLoadState === "error" || (open && !sourceUrl && viewLoadState !== "loading");
  const showLoading =
    open && (viewLoadState === "loading" || viewLoadState === "idle") && !showError;
  const isSinglePage = pageCount <= 1;
  const shellMode =
    showCompactFallback || showError
      ? "compact"
      : showRasterPreview || showNativeImage
        ? "preview"
        : "document";

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      variant="centered"
      zIndex={120}
      ariaLabel="Shipping Label"
      panelClassName="slv-v1__panel"
      className="slv-v1"
      scrollPanel={false}
    >
      <div
        className="slv-v1__shell"
        data-shipping-label-viewer="v1.0"
        data-slv-mode={shellMode}
      >
        <header className="slv-v1__header">
          <button type="button" className="slv-v1__icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
          <div className="slv-v1__header-centre">
            <h2 className="slv-v1__title">Shipping Label</h2>
          </div>
          <button
            type="button"
            className="slv-v1__download"
            disabled={!viewEmbedUrl && !sourceUrl}
            onClick={handleDownload}
          >
            Download
          </button>
        </header>

        {!isSinglePage ? (
          <p className="slv-v1__count" aria-live="polite">
            {viewPage} of {pageCount}
          </p>
        ) : null}

        <div className="slv-v1__stage" data-slv-stage={shellMode}>
          {showLoading ? (
            <div className="slv-v1__loading" role="status" aria-live="polite">
              <span className="slv-v1__spinner" aria-hidden />
              <p className="slv-v1__loading-text">Loading shipping label...</p>
            </div>
          ) : null}

          {showError ? (
            <div className="slv-v1__error" role="alert">
              <p className="slv-v1__error-title">Shipping label unavailable.</p>
              <p className="slv-v1__error-sub">Please try again later.</p>
              <button type="button" className="slv-v1__retry" onClick={handleRetry}>
                Retry
              </button>
            </div>
          ) : null}

          {showNativeImage ? (
            <div className="slv-v1__scroll">
              {/* eslint-disable-next-line @next/next/no-img-element -- official label bytes, not UI branding */}
              <img
                className="slv-v1__image"
                src={viewEmbedUrl!}
                alt="Official shipping label"
                onError={() => setLoadState("error")}
              />
            </div>
          ) : null}

          {showRasterPreview ? (
            <div className="slv-v1__scroll" data-slv-preview="raster">
              {previewUrls.map((url, index) => (
                // eslint-disable-next-line @next/next/no-img-element -- official label page raster, not UI branding
                <img
                  key={url}
                  className="slv-v1__image"
                  src={url}
                  alt={`Official shipping label page ${index + 1}`}
                  hidden={previewUrls.length > 1 && index + 1 !== viewPage}
                />
              ))}
            </div>
          ) : null}

          {showHtmlFrame ? (
            <iframe
              className="slv-v1__frame"
              title="Official Carrier Label"
              src={viewEmbedUrl!}
              onError={() => setLoadState("error")}
            />
          ) : null}

          {showPdfIframe ? (
            <div className="slv-v1__pdf-wrap">
              <iframe
                className="slv-v1__frame"
                title="Official Carrier PDF"
                src={pdfSrc!}
                onError={() => setPreviewMode("compact")}
              />
            </div>
          ) : null}

          {showCompactFallback ? (
            <div className="slv-v1__pdf-fallback" role="status">
              <p className="slv-v1__pdf-fallback-copy">
                Preview is unavailable in this browser. Open the label to view or print.
              </p>
              <button type="button" className="slv-v1__retry" onClick={handleOpenLabel}>
                Open label
              </button>
            </div>
          ) : null}
        </div>

        <footer className="slv-v1__footer">
          {!isSinglePage ? (
            <div className="slv-v1__pager">
              <button
                type="button"
                className="slv-v1__pager-btn"
                disabled={viewPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span className="slv-v1__pager-indicator">
                {viewPage} / {pageCount}
              </span>
              <button
                type="button"
                className="slv-v1__pager-btn"
                disabled={viewPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next →
              </button>
            </div>
          ) : null}
          {!showCompactFallback && (viewEmbedUrl || sourceUrl) ? (
            <button type="button" className="slv-v1__secondary" onClick={handleOpenLabel}>
              Open label
            </button>
          ) : null}
          <button
            type="button"
            className="slv-v1__primary"
            disabled={showError || (!viewEmbedUrl && !sourceUrl)}
            onClick={() => void handlePrintShare()}
          >
            Print / Share
          </button>
        </footer>
      </div>
    </ModalContainer>
  );
}
