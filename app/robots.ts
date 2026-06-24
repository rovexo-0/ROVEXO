import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://rovexo.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/checkout/",
          "/account/",
          "/seller/",
          "/business/",
          "/messages/",
          "/orders/",
          "/saved/",
          "/notifications/",
          "/resolution/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/auctions",
          "/sell/auction",
        ],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap/static.xml`,
      `${baseUrl}/sitemap/categories.xml`,
      `${baseUrl}/sitemap/locations.xml`,
      `${baseUrl}/sitemap/products.xml`,
      `${baseUrl}/sitemap/sellers.xml`,
      `${baseUrl}/sitemap/business.xml`,
      `${baseUrl}/sitemap/blog.xml`,
      `${baseUrl}/sitemap/images.xml`,
    ],
  };
}
