/**
 * Sitemap index XML for crawlers. Served at /sitemap.xml via next.config rewrite
 * so it does not conflict with app/sitemap.ts generateSitemaps() metadata.
 */
import { getAppUrl } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const SITEMAP_IDS = [
  "static",
  "categories",
  "locations",
  "products",
  "sellers",
  "business",
  "brands",
  "discover",
  "collections",
  "trends",
  "blog",
  "images",
] as const;

export async function GET(): Promise<Response> {
  const baseUrl = getAppUrl().replace(/\/$/, "");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_IDS.map(
  (id) => `  <sitemap>
    <loc>${baseUrl}/sitemap/${id}.xml</loc>
  </sitemap>`,
).join("\n")}
</sitemapindex>
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
