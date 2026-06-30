import type { MigrationInputPayload } from "@/lib/seller/migration/engine/types";

export function resolveFileBuffer(payload?: MigrationInputPayload): Buffer | null {
  if (!payload?.fileContent) return null;

  const trimmed = payload.fileContent.trim();
  if (!trimmed) return null;

  const base64Hint = payload.fileEncoding === "base64" || /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed.slice(0, 120));
  if (base64Hint && trimmed.length % 4 === 0) {
    try {
      const buffer = Buffer.from(trimmed, "base64");
      if (buffer.length > 0) return buffer;
    } catch {
      // fall through to utf8
    }
  }

  return Buffer.from(trimmed, "utf8");
}

export function resolveTextContent(payload?: MigrationInputPayload): string | null {
  const buffer = resolveFileBuffer(payload);
  if (!buffer) return null;
  return detectAndDecodeText(buffer);
}

export function detectAndDecodeText(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8");
  }

  const header = buffer.subarray(0, Math.min(buffer.length, 256)).toString("ascii");
  const encodingMatch = header.match(/encoding=["']([^"']+)["']/i);
  const encoding = encodingMatch?.[1]?.toLowerCase() ?? "utf-8";

  if (encoding === "utf-8" || encoding === "utf8") {
    return buffer.toString("utf8");
  }

  return buffer.toString("utf8");
}
