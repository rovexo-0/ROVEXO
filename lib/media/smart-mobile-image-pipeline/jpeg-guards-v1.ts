/**
 * ROVEXO Smart Mobile Image Pipeline — JPEG guards v1.0
 *
 * Shared pure helpers for SOI / UTF-8 corruption detection.
 * Used by Phase I engine and Production upload fail-closed paths.
 */

/** JPEG Start-Of-Image marker — required for Next image optimizer + browsers. */
export function isValidJpegSoi(buffer: Uint8Array): boolean {
  return (
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  );
}

/** Detect UTF-8 replacement corruption of binary JPEGs (FF → EF BF BD). */
export function isUtf8CorruptedJpeg(buffer: Uint8Array): boolean {
  if (buffer.length < 12) return false;
  const fffd = [0xef, 0xbf, 0xbd] as const;
  const startsWithFffd =
    buffer[0] === fffd[0] && buffer[1] === fffd[1] && buffer[2] === fffd[2];
  if (!startsWithFffd) return false;
  for (let i = 0; i < Math.min(buffer.length - 2, 24); i++) {
    if (buffer[i] === 0x00 && buffer[i + 1] === 0x43 && buffer[i + 2] === 0x00) {
      return true;
    }
  }
  return startsWithFffd;
}

export function assertValidJpegBuffer(buffer: Uint8Array, label: string): void {
  if (isUtf8CorruptedJpeg(buffer)) {
    throw new Error(
      `Image data was corrupted during upload (${label}). Please retry the photo.`,
    );
  }
  if (!isValidJpegSoi(buffer)) {
    throw new Error(`Invalid JPEG produced for ${label}. Please retry the photo.`);
  }
}
