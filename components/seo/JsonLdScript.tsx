type JsonLdScriptProps = {
  id: string;
  /** Structured data object, array, or pre-stringified JSON-LD payload. */
  data: unknown;
};

/**
 * Canonical JSON-LD injection for App Router (Next.js 16 / React 19).
 * Server-rendered `<script type="application/ld+json">` so crawlers receive
 * structured data in the initial HTML (no delayed client injection).
 * Payload is scrubbed for XSS (`<` → `\u003c`) per Next.js JSON-LD guide.
 */
export function JsonLdScript({ id, data }: JsonLdScriptProps) {
  const json =
    typeof data === "string"
      ? data
      : JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
