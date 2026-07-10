import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const LABEL_BUCKET = "shipping-labels";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export type PersistedShippingLabel = {
  storagePath: string;
  signedUrl: string | null;
  mimeType: string;
  size: number;
  createdAt: string;
};

export async function persistShippingLabelPdf(input: {
  orderId: string;
  parcelNumber?: number;
  labelUrl: string;
}): Promise<PersistedShippingLabel | null> {
  let buffer: Buffer;
  let contentType = "application/pdf";
  try {
    const response = await fetch(input.labelUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    contentType = response.headers.get("content-type") ?? "application/pdf";
    buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0) return null;
  } catch {
    return null;
  }

  const admin = createAdminClient();
  const extension = contentType.includes("png") ? "png" : "pdf";
  const mimeType = contentType.includes("png") ? "image/png" : "application/pdf";
  const storagePath = `${input.orderId}/parcel-${input.parcelNumber ?? 1}-label.${extension}`;

  const { error } = await admin.storage.from(LABEL_BUCKET).upload(storagePath, buffer, {
    upsert: true,
    contentType: mimeType,
    cacheControl: "3600",
  });

  if (error && !/exist/i.test(error.message)) {
    return null;
  }

  const { data: signed } = await admin.storage
    .from(LABEL_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  return {
    storagePath,
    signedUrl: signed?.signedUrl ?? null,
    mimeType,
    size: buffer.byteLength,
    createdAt: new Date().toISOString(),
  };
}

export async function getShippingLabelSignedUrl(storagePath: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from(LABEL_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}
