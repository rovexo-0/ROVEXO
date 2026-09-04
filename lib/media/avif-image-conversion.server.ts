import "server-only";

import {
  AVIF_CONTENT_TYPE,
  AVIF_DERIVATIVE_SIZES,
  isValidAvifBuffer,
  type AvifDerivativeName,
} from "@/lib/media/avif-image-pipeline-v1";

export type AvifDerivativeBuffer = {
  name: AvifDerivativeName;
  buffer: Buffer;
  bytes: number;
  width: number;
  height: number;
  mimeType: typeof AVIF_CONTENT_TYPE;
};

export type AvifDerivativesResult = {
  thumb: AvifDerivativeBuffer;
  medium: AvifDerivativeBuffer;
  large: AvifDerivativeBuffer;
};

function classifyImageFailure(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/corrupt|truncated|incomplete/i.test(message)) {
    return new Error("Corrupt image rejected.");
  }
  return new Error("Invalid image rejected.");
}

/**
 * Real AVIF conversion from JPEG / PNG / WebP bytes.
 * Fail closed: never returns JPEG bytes labelled as AVIF.
 */
export async function generateAvifDerivatives(input: Buffer): Promise<AvifDerivativesResult> {
  if (!input?.length) {
    throw new Error("Invalid image rejected.");
  }

  const sharp = (await import("sharp")).default;

  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(input, { failOn: "error", animated: false }).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  } catch (error) {
    throw classifyImageFailure(error);
  }

  if (width < 1 || height < 1) {
    throw new Error("Invalid image rejected.");
  }

  const decoded = sharp(input, { failOn: "error", animated: false }).rotate();
  const names = Object.keys(AVIF_DERIVATIVE_SIZES) as AvifDerivativeName[];

  const parts = await Promise.all(
    names.map(async (name) => {
      const spec = AVIF_DERIVATIVE_SIZES[name];
      let buffer: Buffer;
      try {
        buffer = await decoded
          .clone()
          .resize({
            width: spec.maxPx,
            height: spec.maxPx,
            fit: "inside",
            withoutEnlargement: true,
          })
          .avif({
            quality: spec.quality,
            effort: 2,
            chromaSubsampling: "4:2:0",
          })
          .toBuffer();
      } catch (error) {
        throw classifyImageFailure(error);
      }

      if (!isValidAvifBuffer(buffer)) {
        throw new Error("AVIF conversion failed.");
      }

      const info = await sharp(buffer).metadata();
      // libvips reports AVIF as HEIF (AVIF is a HEIF brand). ftyp already proved avif.
      if (info.format !== "heif") {
        throw new Error("AVIF conversion failed.");
      }

      const outWidth = info.width ?? 0;
      const outHeight = info.height ?? 0;
      if (outWidth > spec.maxPx || outHeight > spec.maxPx) {
        throw new Error("AVIF conversion failed.");
      }

      return {
        name,
        buffer,
        bytes: buffer.length,
        width: outWidth,
        height: outHeight,
        mimeType: AVIF_CONTENT_TYPE,
      } satisfies AvifDerivativeBuffer;
    }),
  );

  const byName = Object.fromEntries(parts.map((part) => [part.name, part])) as Record<
    AvifDerivativeName,
    AvifDerivativeBuffer
  >;

  return {
    thumb: byName.thumb,
    medium: byName.medium,
    large: byName.large,
  };
}
