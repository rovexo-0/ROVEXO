import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import {
  getSendcloudPublicKey,
  getSendcloudSecretKey,
  isSendcloudConfigured,
} from "@/lib/shipping/env";
import {
  assertSafeOutboundUrlSync,
  safeFetch,
  SsrfBlockedError,
} from "@/lib/security/ssrf-guard-v1";

const LABEL_BUCKET = "shipping-labels";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
const LABEL_URL_ALLOWLIST = [
  "sendcloud.sc",
  "sendcloud.com",
  "supabase.co",
  "rovexo.co.uk",
] as const;

export type PersistedShippingLabel = {
  storagePath: string;
  signedUrl: string | null;
  mimeType: string;
  size: number;
  createdAt: string;
};

/** Canonical ROVEXO storage key (bucket object path) — never an http(s) URL. */
export function isCanonicalShippingLabelStorageKey(
  path: string | null | undefined,
): boolean {
  const trimmed = path?.trim() ?? "";
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (trimmed.startsWith("/")) return false;
  return trimmed.includes("/");
}

/**
 * Sendcloud panel document endpoints require server-side Basic auth.
 * These MUST NEVER be returned as browser-facing pdfUrl.
 */
export function isSendcloudPanelDocumentUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const sendcloudHost =
      host === "panel.sendcloud.sc" ||
      host.endsWith(".sendcloud.sc") ||
      host === "panel.sendcloud.com" ||
      host.endsWith(".sendcloud.com");
    if (!sendcloudHost) return false;
    const path = parsed.pathname.toLowerCase();
    return (
      path.includes("/documents/") ||
      path.includes("/label") ||
      path.includes("/labels/")
    );
  } catch {
    return false;
  }
}

function sendcloudBasicAuthHeader(): string {
  const encoded = Buffer.from(
    `${getSendcloudPublicKey()}:${getSendcloudSecretKey()}`,
  ).toString("base64");
  return `Basic ${encoded}`;
}

function looksLikeLabelBinary(buffer: Buffer, contentType: string): boolean {
  if (buffer.byteLength < 5) return false;
  const head = buffer.subarray(0, 5).toString("utf8");
  if (head.startsWith("%PDF")) return true;
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  const ct = contentType.toLowerCase();
  if (ct.includes("pdf") || ct.includes("png") || ct.includes("jpeg") || ct.includes("jpg")) {
    // Reject obvious JSON error bodies even when Content-Type lied.
    const textHead = buffer.subarray(0, 64).toString("utf8").trimStart();
    if (textHead.startsWith("{") || textHead.startsWith("<!")) return false;
    return true;
  }
  return false;
}

/**
 * Server-side document download. Uses Sendcloud Basic auth for panel document URLs.
 * Never runs in the browser. Never returns credentials.
 */
export async function downloadShippingLabelDocumentBytes(
  labelUrl: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    assertSafeOutboundUrlSync(labelUrl, { allowedHostSuffixes: LABEL_URL_ALLOWLIST });

    const headers: Record<string, string> = {
      Accept: "application/pdf,application/octet-stream,image/png,image/jpeg,*/*",
    };

    if (isSendcloudPanelDocumentUrl(labelUrl)) {
      if (!isSendcloudConfigured()) return null;
      headers.Authorization = sendcloudBasicAuthHeader();
      const response = await fetch(labelUrl, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
        headers,
      });
      if (!response.ok) return null;
      const contentType = response.headers.get("content-type") ?? "application/pdf";
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!looksLikeLabelBinary(buffer, contentType)) return null;
      return { buffer, contentType };
    }

    const response = await safeFetch(labelUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      ssrf: { allowedHostSuffixes: LABEL_URL_ALLOWLIST },
      headers,
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "application/pdf";
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!looksLikeLabelBinary(buffer, contentType)) return null;
    return { buffer, contentType };
  } catch (error) {
    if (error instanceof SsrfBlockedError) return null;
    return null;
  }
}

export function buildCanonicalShippingLabelStoragePath(input: {
  orderId: string;
  parcelNumber?: number;
  extension?: "pdf" | "png";
}): string {
  return `${input.orderId}/parcel-${input.parcelNumber ?? 1}-label.${input.extension ?? "pdf"}`;
}

async function uploadLabelBytes(input: {
  storagePath: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(LABEL_BUCKET).upload(input.storagePath, input.buffer, {
    upsert: true,
    contentType: input.mimeType,
    cacheControl: "3600",
  });
  if (error && !/exist/i.test(error.message)) {
    return false;
  }
  return true;
}

export async function persistShippingLabelPdf(input: {
  orderId: string;
  parcelNumber?: number;
  labelUrl: string;
}): Promise<PersistedShippingLabel | null> {
  const downloaded = await downloadShippingLabelDocumentBytes(input.labelUrl);
  if (!downloaded) return null;

  const contentType = downloaded.contentType;
  const extension = contentType.includes("png") ? "png" : "pdf";
  const mimeType = contentType.includes("png") ? "image/png" : "application/pdf";
  const storagePath = buildCanonicalShippingLabelStoragePath({
    orderId: input.orderId,
    parcelNumber: input.parcelNumber,
    extension,
  });

  const uploaded = await uploadLabelBytes({
    storagePath,
    buffer: downloaded.buffer,
    mimeType,
  });
  if (!uploaded) return null;

  const signedUrl = await getShippingLabelSignedUrl(storagePath);

  return {
    storagePath,
    signedUrl,
    mimeType,
    size: downloaded.buffer.byteLength,
    createdAt: new Date().toISOString(),
  };
}

export async function getShippingLabelSignedUrl(storagePath: string): Promise<string | null> {
  if (!isCanonicalShippingLabelStorageKey(storagePath)) return null;
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from(LABEL_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

async function shippingLabelObjectExists(storagePath: string): Promise<boolean> {
  if (!isCanonicalShippingLabelStorageKey(storagePath)) return false;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(LABEL_BUCKET).download(storagePath);
  return Boolean(data) && !error;
}

function isBrowserReadableHttpsLabelUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith("supabase.co") ||
      host === "www.rovexo.co.uk" ||
      host === "rovexo.co.uk" ||
      host.endsWith(".rovexo.co.uk")
    );
  } catch {
    return false;
  }
}

/**
 * P7.26 — Resolve a browser-safe ROVEXO pdfUrl for an existing READY label.
 * Materializes Sendcloud panel document URLs into the shipping-labels bucket (idempotent).
 * Never returns panel.sendcloud.sc URLs. Never exposes Sendcloud credentials.
 */
export async function resolveBrowserShippingLabelPdfUrl(input: {
  orderId: string;
  labelRowId?: string | null;
  parcelNumber?: number | null;
  trackingNumber?: string | null;
  labelStoragePath?: string | null;
  labelUrl?: string | null;
}): Promise<{ pdfUrl: string; storagePath: string; materialized: boolean } | null> {
  const storagePath = input.labelStoragePath?.trim() || null;
  const labelUrl = input.labelUrl?.trim() || null;

  // Already canonical ROVEXO storage key → re-sign only.
  if (storagePath && isCanonicalShippingLabelStorageKey(storagePath)) {
    const signed = await getShippingLabelSignedUrl(storagePath);
    if (!signed) return null;
    return { pdfUrl: signed, storagePath, materialized: false };
  }

  // App-relative demo / same-origin presentation paths.
  if (storagePath?.startsWith("/")) {
    return { pdfUrl: storagePath, storagePath, materialized: false };
  }
  if (labelUrl?.startsWith("/")) {
    return { pdfUrl: labelUrl, storagePath: labelUrl, materialized: false };
  }

  const providerDocumentUrl =
    (storagePath && isSendcloudPanelDocumentUrl(storagePath) ? storagePath : null) ||
    (labelUrl && isSendcloudPanelDocumentUrl(labelUrl) ? labelUrl : null);

  if (providerDocumentUrl) {
    const targetPath = buildCanonicalShippingLabelStoragePath({
      orderId: input.orderId,
      parcelNumber: input.parcelNumber ?? 1,
    });

    // Idempotent: reuse existing bucket object without re-download / without announce.
    if (await shippingLabelObjectExists(targetPath)) {
      const existingSigned = await getShippingLabelSignedUrl(targetPath);
      if (!existingSigned) return null;
      await persistCanonicalStoragePathOnLabelRow({
        labelRowId: input.labelRowId,
        orderId: input.orderId,
        trackingNumber: input.trackingNumber,
        storagePath: targetPath,
      });
      return { pdfUrl: existingSigned, storagePath: targetPath, materialized: false };
    }

    const stored = await persistShippingLabelPdf({
      orderId: input.orderId,
      parcelNumber: input.parcelNumber ?? 1,
      labelUrl: providerDocumentUrl,
    });
    if (!stored?.storagePath || !stored.signedUrl) return null;

    await persistCanonicalStoragePathOnLabelRow({
      labelRowId: input.labelRowId,
      orderId: input.orderId,
      trackingNumber: input.trackingNumber,
      storagePath: stored.storagePath,
    });

    return {
      pdfUrl: stored.signedUrl,
      storagePath: stored.storagePath,
      materialized: true,
    };
  }

  // Non-Sendcloud https already in Supabase/ROVEXO public form — allow as-is.
  const httpsCandidate =
    (storagePath && /^https?:\/\//i.test(storagePath) ? storagePath : null) ||
    (labelUrl && /^https?:\/\//i.test(labelUrl) ? labelUrl : null);
  if (httpsCandidate && isBrowserReadableHttpsLabelUrl(httpsCandidate)) {
    return { pdfUrl: httpsCandidate, storagePath: httpsCandidate, materialized: false };
  }

  // Fail closed: never return authenticated Sendcloud panel URLs (or unknown hosts).
  return null;
}

async function persistCanonicalStoragePathOnLabelRow(input: {
  labelRowId?: string | null;
  orderId: string;
  trackingNumber?: string | null;
  storagePath: string;
}): Promise<void> {
  // shipping_labels_v1 is not in generated Database types yet — use shipping admin client.
  const admin = createShippingAdminClient();
  const patch = {
    label_storage_path: input.storagePath,
    pdf_storage_path: input.storagePath,
    updated_at: new Date().toISOString(),
  };

  if (input.labelRowId) {
    await admin.from("shipping_labels_v1").update(patch).eq("id", input.labelRowId);
    return;
  }

  if (input.trackingNumber) {
    await admin
      .from("shipping_labels_v1")
      .update(patch)
      .eq("tracking_number", input.trackingNumber);
  }
}
