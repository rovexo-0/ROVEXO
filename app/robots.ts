import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://rovexo.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout/", "/account/", "/seller/", "/business/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
