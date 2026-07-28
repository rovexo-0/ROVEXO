/**
 * Listing image auto-enhance (DEFECT #005).
 * Mild photographic polish only — never crops, never invents product content.
 * Uses sharp: EXIF rotate · normalize · gentle sharpen · controlled JPEG.
 */

export type EnhancedListingImage = {
  buffer: Buffer;
  contentType: "image/jpeg";
  bytes: number;
};

async function loadSharp() {
  const sharp = (await import("sharp")).default;
  return sharp;
}

/**
 * Auto-enhance a listing photo for marketplace clarity.
 * Safe defaults: no aggressive filters, no AI generative fill.
 */
export async function enhanceListingImage(input: Buffer): Promise<EnhancedListingImage> {
  const sharp = await loadSharp();

  const pipeline = sharp(input, { animated: false, failOn: "none" })
    .rotate() // honour EXIF orientation
    .normalize({ lower: 2, upper: 98 }) // gentle white-balance / contrast
    .modulate({
      brightness: 1.03,
      saturation: 1.04,
    })
    .sharpen({
      sigma: 0.7,
      m1: 0.6,
      m2: 0.3,
    })
    .jpeg({
      quality: 86,
      mozjpeg: true,
      chromaSubsampling: "4:2:0",
    });

  const buffer = await pipeline.toBuffer();
  return {
    buffer,
    contentType: "image/jpeg",
    bytes: buffer.length,
  };
}
