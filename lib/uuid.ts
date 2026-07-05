/**
 * Cross-browser UUID generator.
 *
 * `crypto.randomUUID()` is only exposed in secure contexts (HTTPS or
 * localhost). On iOS Safari/Chrome loaded over a plain-HTTP LAN origin
 * (e.g. http://192.168.x.x:3000) it is `undefined`, so calling it throws
 * "crypto.randomUUID is not a function". This helper prefers the native
 * implementation and falls back to an RFC 4122 v4 UUID built from
 * `crypto.getRandomValues` (available in non-secure contexts) or, as a last
 * resort, `Math.random`.
 */
export function safeRandomUUID(): string {
  const cryptoObj = globalThis.crypto;

  if (typeof cryptoObj?.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof cryptoObj?.getRandomValues === "function") {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set the version (4) and variant (10xx) bits per RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    hex.push(bytes[i].toString(16).padStart(2, "0"));
  }

  return (
    `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-` +
    `${hex[4]}${hex[5]}-` +
    `${hex[6]}${hex[7]}-` +
    `${hex[8]}${hex[9]}-` +
    `${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`
  );
}
