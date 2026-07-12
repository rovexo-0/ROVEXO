import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/supabase/env";
import { isLaunchPrivateMode } from "@/lib/launch-certification/private-mode";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  if (isLaunchPrivateMode()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

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
      `${baseUrl}/sitemap/brands.xml`,
      `${baseUrl}/sitemap/discover.xml`,
      `${baseUrl}/sitemap/collections.xml`,
      `${baseUrl}/sitemap/trends.xml`,
      `${baseUrl}/sitemap/blog.xml`,
      `${baseUrl}/sitemap/images.xml`,
    ],
  };
}
