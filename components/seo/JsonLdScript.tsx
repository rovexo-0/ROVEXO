import Script from "next/script";

type JsonLdScriptProps = {
  id: string;
  /** Structured data object, array, or pre-stringified JSON-LD payload. */
  data: unknown;
};

/**
 * Canonical JSON-LD injection for App Router (Next.js 16 / React 19).
 * Uses `next/script` so React does not warn about raw <script> in components.
 * Payload is scrubbed for XSS (`<` → `\u003c`) per Next.js JSON-LD guide.
 */
export function JsonLdScript({ id, data }: JsonLdScriptProps) {
  const json =
    typeof data === "string"
      ? data
      : JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
