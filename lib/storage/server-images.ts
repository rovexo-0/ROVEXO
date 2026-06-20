import sharp from "sharp";

const MAX_WIDTH = 2000;
const THUMB_WIDTH = 400;
const JPEG_QUALITY = 85;

export type ProcessedImage = {
  full: Buffer;
  thumbnail: Buffer;
  contentType: "image/jpeg";
  extension: "jpg";
};

export async function processListingImage(input: Buffer): Promise<ProcessedImage> {
  const full = await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  const thumbnail = await sharp(full)
    .resize({ width: THUMB_WIDTH, height: THUMB_WIDTH, fit: "cover" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  return { full, thumbnail, contentType: "image/jpeg", extension: "jpg" };
}

export function buildProductImagePath(
  sellerId: string,
  productId: string,
  filename: string,
): string {
  return `${sellerId}/${productId}/${filename}`;
}

export function buildTempImagePath(
  sellerId: string,
  sessionId: string,
  filename: string,
): string {
  return `${sellerId}/temp/${sessionId}/${filename}`;
}
