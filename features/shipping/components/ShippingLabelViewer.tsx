"use client";

/**
 * ROVEXO v1.0 — Shipping Label Viewer (CANONICAL · FROZEN)
 * Single presentation component for official carrier PDFs and demo labels.
 * Never recreates, redraws, or regenerates labels. No duplicate viewers.
 *
 * Fetches the existing label URL into a same-origin blob so the document
 * is visible even when carriers / storage block cross-origin iframes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ModalContainer } from "@/components/ui/ModalContainer";
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

export function ShippingLabelViewer({
  open,
  onClose,
  pdfUrl,
  orderId = null,
}: ShippingLabelViewerProps) {
  const objectUrlRef = useRef<string | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("application/pdf");
  const [page, setPage] = useState(1);
  const pageCount = 1;
  const loadGeneration = useRef(0);

  const sourceUrl = pdfUrl?.trim() || null;

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const loadLabel = useCallback(async () => {
    const generation = ++loadGeneration.current;
    revokeObjectUrl();
    setEmbedUrl(null);
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
        credentials: "include",
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
      setLoadState("ready");
    } catch {
      if (generation !== loadGeneration.current) return;
      /* Same-origin relative URLs can still embed directly. */
      if (sourceUrl.startsWith("/")) {
        setMimeType(sourceUrl.includes("demo-label") ? "text/html" : "application/pdf");
        setEmbedUrl(sourceUrl);
        setLoadState("ready");
        return;
      }
      setLoadState("error");
    }
  }, [sourceUrl, orderId, revokeObjectUrl]);

  useEffect(() => {
    if (!open) {
      loadGeneration.current += 1;
      revokeObjectUrl();
      // Reset display via derived values when closed — avoid sync setState in this effect.
      return;
    }
    let cancelled = false;
    // Defer loadLabel: its first statements call setState — must not run sync in the effect body.
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

  useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl]);

  const handleRetry = useCallback(() => {
    void loadLabel();
  }, [loadLabel]);

  const handleDownload = useCallback(() => {
    const href = embedUrl || sourceUrl;
    if (!href) return;
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.download = mimeType.includes("png")
      ? "rovexo-shipping-label.png"
      : mimeType.includes("html")
        ? "rovexo-shipping-label.html"
        : "rovexo-shipping-label.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [embedUrl, sourceUrl, mimeType]);

  const handlePrintShare = useCallback(async () => {
    const href = embedUrl || sourceUrl;
    if (!href) return;

    // Prefer native share with the label file (mobile / PWA) — avoids broken print preview.
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

    // HTML demo labels can print from the same-origin iframe.
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

    // Open label in a browser tab so the platform print dialog works
    // (embedded PDF print often shows "This app doesn't support print preview").
    const absolute = resolveAbsoluteUrl(sourceUrl || href);
    const printWindow = window.open(absolute, "_blank", "noopener,noreferrer");
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

    handleDownload();
  }, [embedUrl, sourceUrl, mimeType, handleDownload]);

  const pdfSrc =
    viewEmbedUrl && mimeType.includes("pdf")
      ? `${viewEmbedUrl}#toolbar=0&navpanes=0&scrollbar=1&view=Fit`
      : viewEmbedUrl;

  const isImage = mimeType.startsWith("image/");
  const isHtml = mimeType.includes("html");
  const showDocument = viewLoadState === "ready" && Boolean(viewEmbedUrl);
  const showError =
    viewLoadState === "error" || (open && !sourceUrl && viewLoadState !== "loading");
  const showLoading =
    open && (viewLoadState === "loading" || viewLoadState === "idle") && !showError;
  const isSinglePage = pageCount <= 1;

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
      <div className="slv-v1__shell" data-shipping-label-viewer="v1.0">
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

        <div className="slv-v1__stage">
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

          {showDocument && isImage ? (
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

          {showDocument && isHtml ? (
            <iframe
              className="slv-v1__frame"
              title="Official Carrier Label"
              src={viewEmbedUrl!}
              onError={() => setLoadState("error")}
            />
          ) : null}

          {showDocument && !isImage && !isHtml ? (
            <div className="slv-v1__pdf-wrap">
              <object
                className="slv-v1__frame"
                data={pdfSrc!}
                type="application/pdf"
                aria-label="Official Carrier PDF"
              >
                <iframe
                  className="slv-v1__frame"
                  title="Official Carrier PDF"
                  src={pdfSrc!}
                  onError={() => setLoadState("error")}
                />
              </object>
              <div className="slv-v1__pdf-fallback">
                <p className="slv-v1__pdf-fallback-copy">
                  If the label preview is blank, open it in your browser to view or print.
                </p>
                <button
                  type="button"
                  className="slv-v1__retry"
                  onClick={() => {
                    const href = embedUrl || sourceUrl;
                    if (!href) return;
                    window.open(resolveAbsoluteUrl(href), "_blank", "noopener,noreferrer");
                  }}
                >
                  Open label
                </button>
              </div>
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
