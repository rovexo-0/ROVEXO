import type { Metadata } from "next";
import { HubPageMain } from "@/components/layout/HubPageMain";
import "@/styles/rovexo/header-v2.css";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ImageSearchView } from "@/features/search/components/ImageSearchView";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

export const metadata: Metadata = buildPageMetadata({
  title: "Image Search",
  description: "Results similar to your photo",
  path: CAMERA_SEARCH_V1.resultsRoute,
  noIndex: true,
});

/**
 * Official Camera Search results page — Master Freeze SSOT.
 * Route: /search/image/results
 */
export default function ImageSearchResultsPage() {
  return (
    <BetaAppShell bottomNavTab="search">
      <RovexoHeaderV2 />
      <HubPageMain className="rx-image-search-page px-0 py-0">
        <ImageSearchView />
      </HubPageMain>
    </BetaAppShell>
  );
}
