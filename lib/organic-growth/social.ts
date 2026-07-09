export {
  buildDynamicOgImageUrl,
  buildSocialPreviews,
  platformShareLink,
  nativeShareMetadata,
  deepLinkUrl,
  qrCodeUrl,
  type SocialPlatform,
  type SocialPreview,
} from "@/lib/seo/engine/social";

import { buildSocialPreviews, buildDynamicOgImageUrl, platformShareLink } from "@/lib/seo/engine/social";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";

/** Social Discovery Engine — optimizes every public page for sharing across platforms. */
export function buildPageSocialDiscovery(page: Pick<OrganicLandingPage, "title" | "description" | "path">) {
  const previews = buildSocialPreviews(page);
  const ogImage = buildDynamicOgImageUrl({
    title: page.title.replace(/ \| ROVEXO$/, ""),
    path: page.path,
  });

  return {
    openGraph: {
      title: page.title,
      description: page.description,
      image: ogImage,
      url: page.path,
    },
    twitterCard: {
      card: "summary_large_image" as const,
      title: page.title,
      description: page.description,
      image: ogImage,
    },
    platformLinks: previews.map((preview) => ({
      platform: preview.platform,
      shareUrl: platformShareLink(preview.platform, preview.shareUrl, page.title),
    })),
    previews,
  };
}
