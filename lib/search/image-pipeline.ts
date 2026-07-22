/**
 * Search Engine v1.0 image pipeline — Camera Search (NO AI).
 * Take/Upload → validate → (optional rotate/crop) → compress → match.
 */

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 12 * 1024 * 1024;
const DEFAULT_MAX_EDGE = 640;
const DEFAULT_QUALITY = 0.82;

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; reason: "empty" | "type" | "size" | "decode" | "canvas" };

export type ImagePipelineResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "empty" | "type" | "size" | "decode" | "canvas" };

export function validateSearchImageFile(file: File | null | undefined): ImageValidationResult {
  if (!file) return { ok: false, reason: "empty" };
  if (file.size <= 0) return { ok: false, reason: "empty" };
  if (file.size > MAX_BYTES) return { ok: false, reason: "size" };
  if (file.type && !ALLOWED_TYPES.has(file.type.toLowerCase()) && !file.type.startsWith("image/")) {
    return { ok: false, reason: "type" };
  }
  return { ok: true };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode"));
    image.src = src;
  });
}

export type PrepareSearchImageOptions = {
  maxEdge?: number;
  quality?: number;
  /** Clockwise rotation in degrees (0 | 90 | 180 | 270). */
  rotateDeg?: 0 | 90 | 180 | 270;
  /** Center-square crop before compress (image matching stability). */
  centerCrop?: boolean;
};

/**
 * Validate → optional rotate/crop → compress to JPEG data URL.
 * Fail-safe: caller must fall back to text search when `ok: false`.
 */
export async function prepareSearchImage(
  file: File,
  options: PrepareSearchImageOptions = {},
): Promise<ImagePipelineResult> {
  const validation = validateSearchImageFile(file);
  if (!validation.ok) return validation;

  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const rotateDeg = options.rotateDeg ?? 0;
  const centerCrop = options.centerCrop ?? true;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(objectUrl);
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    if (!sourceSize) return { ok: false, reason: "decode" };

    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;

    if (centerCrop) {
      sw = sourceSize;
      sh = sourceSize;
      sx = Math.floor((image.naturalWidth - sourceSize) / 2);
      sy = Math.floor((image.naturalHeight - sourceSize) / 2);
    }

    const scale = Math.min(1, maxEdge / Math.max(sw, sh));
    const baseW = Math.max(1, Math.round(sw * scale));
    const baseH = Math.max(1, Math.round(sh * scale));
    const swapped = rotateDeg === 90 || rotateDeg === 270;
    const canvasW = swapped ? baseH : baseW;
    const canvasH = swapped ? baseW : baseH;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const context = canvas.getContext("2d");
    if (!context) return { ok: false, reason: "canvas" };

    context.translate(canvasW / 2, canvasH / 2);
    context.rotate((rotateDeg * Math.PI) / 180);
    context.drawImage(image, sx, sy, sw, sh, -baseW / 2, -baseH / 2, baseW, baseH);

    return { ok: true, dataUrl: canvas.toDataURL("image/jpeg", quality) };
  } catch {
    return { ok: false, reason: "decode" };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
