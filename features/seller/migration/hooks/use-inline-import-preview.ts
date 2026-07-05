"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildOAuthReadyPreview,
  buildUrlPreview,
  importMethodNeedsFilePreview,
  importMethodNeedsUrlPreview,
  resolvePreviewEndpoint,
  type InlineImportPreview,
} from "@/lib/bring-your-item/inline-import-engine";
import type { MigrationImportMethodId } from "@/lib/seller/migration/types";
import type { MigrationSourceInput } from "@/features/seller/migration/components/MigrationSourceFields";

type UseInlineImportPreviewOptions = {
  importMethod: MigrationImportMethodId | null;
  source: MigrationSourceInput;
  platformLabel: string;
  isOAuthReady: boolean;
  enabled: boolean;
};

export function useInlineImportPreview({
  importMethod,
  source,
  platformLabel,
  isOAuthReady,
  enabled,
}: UseInlineImportPreviewOptions) {
  const [internalPreview, setInternalPreview] = useState<InlineImportPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const preview = enabled ? internalPreview : null;
  const activePreviewError = enabled ? previewError : null;
  const activeIsPreviewing = enabled ? isPreviewing : false;

  const runPreview = useCallback(async () => {
    if (!importMethod || !enabled) return null;

    const requestId = ++requestIdRef.current;
    setIsPreviewing(true);
    setPreviewError(null);

    try {
      if (importMethod === "api_import" && isOAuthReady) {
        const oauthPreview = buildOAuthReadyPreview(platformLabel);
        if (requestId === requestIdRef.current) setInternalPreview(oauthPreview);
        return oauthPreview;
      }

      if (importMethodNeedsUrlPreview(importMethod)) {
        const urls =
          importMethod === "store_import"
            ? source.storeUrl.trim()
              ? [source.storeUrl.trim()]
              : []
            : source.sourceUrls
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);

        const urlPreview = buildUrlPreview(urls);
        if (requestId === requestIdRef.current) {
          setInternalPreview(urlPreview);
          if (urlPreview && urlPreview.validation.some((entry) => !entry.valid)) {
            setPreviewError("One or more URLs are invalid.");
          }
        }
        return urlPreview;
      }

      if (importMethodNeedsFilePreview(importMethod)) {
        if (!source.fileContent || !source.fileName) {
          if (requestId === requestIdRef.current) setInternalPreview(null);
          return null;
        }

        const endpoint = resolvePreviewEndpoint(importMethod);
        if (!endpoint) return null;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: source.fileContent,
            fileEncoding: source.fileEncoding ?? "utf8",
            limit: 5,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Unable to preview file.");
        }

        const payload = (await response.json()) as {
          totalRows: number;
          preview: InlineImportPreview["preview"];
          validation: InlineImportPreview["validation"];
          headers?: string[];
        };

        const next: InlineImportPreview = {
          totalRows: payload.totalRows,
          preview: payload.preview,
          validation: payload.validation,
          headers: payload.headers,
          sourceLabel: `${payload.totalRows} row(s) detected`,
        };

        if (requestId === requestIdRef.current) setInternalPreview(next);
        return next;
      }

      if (requestId === requestIdRef.current) setInternalPreview(null);
      return null;
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setInternalPreview(null);
        setPreviewError(error instanceof Error ? error.message : "Preview failed.");
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setIsPreviewing(false);
    }
  }, [enabled, importMethod, isOAuthReady, platformLabel, source]);

  const sourceSignature = useMemo(
    () =>
      [
        source.storeUrl,
        source.sourceUrls,
        source.fileName,
        source.fileEncoding,
        source.fileContent?.slice(0, 64),
      ].join("|"),
    [source.fileContent, source.fileEncoding, source.fileName, source.sourceUrls, source.storeUrl],
  );

  useEffect(() => {
    if (!enabled || !importMethod) return;

    const timer = window.setTimeout(() => {
      void runPreview();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [enabled, importMethod, runPreview, sourceSignature]);

  const clearPreview = useCallback(() => {
    requestIdRef.current += 1;
    setInternalPreview(null);
    setPreviewError(null);
    setIsPreviewing(false);
  }, []);

  return {
    preview,
    isPreviewing: activeIsPreviewing,
    previewError: activePreviewError,
    runPreview,
    clearPreview,
  };
}
