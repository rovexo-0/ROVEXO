/**
 * ROVEXO Single Source of Truth migration.
 * Moves official homepage stack to components/home/ with Rovexo* names.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const archiveHome = join(root, "archive", "homepages");
const archivePremium = join(root, "archive", "premium");
const archiveStyles = join(root, "archive", "styles");

const RENAMES = [
  ["components/premium/RovexoHomePage.tsx", "components/home/RovexoHomePage.tsx"],
  ["components/premium/PremiumHeader.tsx", "components/home/RovexoHeader.tsx"],
  ["components/premium/SearchBar.tsx", "components/home/RovexoSearchBar.tsx"],
  ["components/premium/InfiniteCategoryRail.tsx", "components/home/RovexoCategoryRail.tsx"],
  ["components/premium/CategoryCard.tsx", "components/home/RovexoCategoryCard.tsx"],
  ["components/premium/PremiumBringYourItemBanner.tsx", "components/home/RovexoBanner.tsx"],
  ["components/premium/FeaturedListings.tsx", "components/home/RovexoFeaturedListings.tsx"],
  ["components/premium/RecommendedListings.tsx", "components/home/RovexoRecommendedListings.tsx"],
  ["components/premium/NewListings.tsx", "components/home/RovexoNewListings.tsx"],
  ["components/premium/BoostListings.tsx", "components/home/RovexoBoostListings.tsx"],
  ["components/premium/PremiumListings.tsx", "components/home/RovexoPremiumListings.tsx"],
  ["components/premium/HomeBusinessesSection.tsx", "components/home/RovexoBusinesses.tsx"],
  ["components/premium/BusinessCard.tsx", "components/home/RovexoBusinessCard.tsx"],
  ["components/premium/BusinessCard.module.css", "components/home/RovexoBusinessCard.module.css"],
  ["components/premium/AllListingsSection.tsx", "components/home/RovexoAllListings.tsx"],
  ["components/premium/AllListingsGrid.tsx", "components/home/RovexoAllListingsGrid.tsx"],
  ["components/premium/AllListingsGrid.module.css", "components/home/RovexoAllListingsGrid.module.css"],
  ["components/premium/AllListingsCard.tsx", "components/home/RovexoAllListingsCard.tsx"],
  ["components/premium/AllListingsCard.module.css", "components/home/RovexoAllListingsCard.module.css"],
  ["components/premium/ListingCarouselSection.tsx", "components/home/RovexoListingCarouselSection.tsx"],
  ["components/premium/ListingCard.tsx", "components/home/RovexoListingCard.tsx"],
  ["components/premium/ListingCard.module.css", "components/home/RovexoListingCard.module.css"],
  ["components/premium/BottomNavigation.tsx", "components/home/RovexoFooterNavigation.tsx"],
  ["components/premium/MobileHeaderScrollContext.tsx", "components/home/RovexoMobileHeaderScrollContext.tsx"],
  ["components/premium/constants.ts", "components/home/rovexo-home-constants.ts"],
  ["components/premium/hooks/useInfiniteCarousel.ts", "components/home/hooks/useInfiniteCarousel.ts"],
  ["components/premium/hooks/useMarketplaceFeedColumns.ts", "components/home/hooks/useMarketplaceFeedColumns.ts"],
  ["components/premium/hooks/useVirtualizedFeedWindow.ts", "components/home/hooks/useVirtualizedFeedWindow.ts"],
];

const LEGACY_HOME_ARCHIVE = [
  "components/home/HomeContent.tsx",
  "components/home/HomeCategoryRail.tsx",
  "components/home/HomeHeroBanner.tsx",
  "components/home/HomeHero.tsx",
  "components/home/HomeHeroSearch.tsx",
  "components/home/BringYourItemsBanner.tsx",
  "components/home/HomeBenefitsRail.tsx",
  "components/home/HomePromoBanner.tsx",
  "components/home/HomeSecondaryBanners.tsx",
  "components/home/CategoryGridSection.tsx",
  "components/home/QuickFiltersRail.tsx",
  "components/home/TrendingSearchesSection.tsx",
  "components/home/HomeTrendingSearchesSection.tsx",
  "components/home/HomeRecentlyViewedCarousel.tsx",
  "components/home/PopularListingsGrid.tsx",
  "components/home/ProductCarouselSection.tsx",
  "components/home/AuctionsSection.tsx",
  "components/home/MobileHeaderScrollContext.tsx",
];

const LEGACY_PREMIUM_ARCHIVE = [
  "components/premium/PremiumHero.tsx",
  "components/premium/ImportListingBanner.tsx",
  "components/premium/DealsSection.tsx",
  "components/premium/BusinessSection.tsx",
  "components/premium/BenefitsSection.tsx",
  "components/premium/PremiumFooter.tsx",
  "components/premium/ListingGrid.tsx",
  "components/premium/LatestListings.tsx",
  "components/premium/PopularListings.tsx",
  "components/premium/TrendingListings.tsx",
  "components/premium/BringYourItemLanding.tsx",
  "components/premium/BringYourItemCta.tsx",
  "components/premium/PremiumButton.tsx",
  "components/premium/categoryLucideIcons.tsx",
  "components/premium/index.ts",
];

const LEGACY_STYLE_ARCHIVE = [
  "styles/rovexo/premium-2026.css",
  "styles/rovexo/home-final.css",
  "styles/rovexo/home-polish.css",
  "styles/rovexo/home-launch-polish.css",
  "styles/rovexo/home-v1-launch-polish.css",
  "styles/rovexo/home-v1-visual-qa.css",
  "styles/rovexo/home-product-cards.css",
  "styles/rovexo/home-sections-premium.css",
];

const CONSUMER_FILES = [
  "app/page.tsx",
  "components/beta/BetaAppShell.tsx",
  "lib/homepage/demo-data.ts",
  "components/ui/BottomNavigation.tsx",
  "tests/mobile-header-scroll.test.ts",
  "tests/home-hydration.test.ts",
  "tests/home-enterprise-migration.test.ts",
  "tests/ux-architecture.test.ts",
];

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function moveToArchive(src, archiveRoot, subpath = "") {
  const full = join(root, src);
  if (!existsSync(full)) return;
  const base = subpath || src.replace(/^components\/(home|premium)\//, "").replace(/^styles\/rovexo\//, "");
  const dest = join(archiveRoot, base);
  ensureDir(dirname(dest));
  if (existsSync(dest)) rmSync(dest, { force: true });
  renameSync(full, dest);
}

function copyRename(src, dest) {
  const from = join(root, src);
  const to = join(root, dest);
  if (!existsSync(from)) {
    console.warn(`skip missing: ${src}`);
    return;
  }
  ensureDir(dirname(to));
  cpSync(from, to);
}

const REPLACEMENTS = [
  [/@\/styles\/rovexo\/premium-2026\.css/g, "@/styles/rovexo-homepage.css"],
  [/@\/components\/premium\//g, "@/components/home/"],
  [/from "@\/components\/premium\/constants"/g, 'from "@/components/home/rovexo-home-constants"'],
  [/PremiumHeader/g, "RovexoHeader"],
  [/PremiumHeaderProps/g, "RovexoHeaderProps"],
  [/SearchBar/g, "RovexoSearchBar"],
  [/InfiniteCategoryRail/g, "RovexoCategoryRail"],
  [/CategoryCard/g, "RovexoCategoryCard"],
  [/PremiumBringYourItemBanner/g, "RovexoBanner"],
  [/FeaturedListings/g, "RovexoFeaturedListings"],
  [/RecommendedListings/g, "RovexoRecommendedListings"],
  [/NewListings/g, "RovexoNewListings"],
  [/BoostListings/g, "RovexoBoostListings"],
  [/PremiumListings/g, "RovexoPremiumListings"],
  [/HomeBusinessesSection/g, "RovexoBusinesses"],
  [/BusinessCard/g, "RovexoBusinessCard"],
  [/AllListingsSection/g, "RovexoAllListings"],
  [/AllListingsGrid/g, "RovexoAllListingsGrid"],
  [/AllListingsCard/g, "RovexoAllListingsCard"],
  [/ListingCarouselSection/g, "RovexoListingCarouselSection"],
  [/(?<![A-Za-z])ListingCard(?![A-Za-z])/g, "RovexoListingCard"],
  [/BottomNavigation/g, "RovexoFooterNavigation"],
  [/BottomNavigationProps/g, "RovexoFooterNavigationProps"],
  [/MobileHeaderScrollProvider/g, "RovexoMobileHeaderScrollProvider"],
  [/useMobileHeaderScrollContext/g, "useRovexoMobileHeaderScrollContext"],
  [/MobileHeaderScrollContext/g, "RovexoMobileHeaderScrollContext"],
  [/PremiumBusiness/g, "RovexoBusiness"],
  [/PremiumCategory/g, "RovexoCategory"],
  [/PREMIUM_VIEW_ALL/g, "ROVEXO_VIEW_ALL"],
  [/PREMIUM_CATEGORIES/g, "ROVEXO_CATEGORIES"],
  [/PREMIUM_BUSINESS_FALLBACK/g, "ROVEXO_BUSINESS_FALLBACK"],
  [/premium-page-home/g, "rovexo-page-home"],
  [/BusinessCard\.module/g, "RovexoBusinessCard.module"],
  [/AllListingsGrid\.module/g, "RovexoAllListingsGrid.module"],
  [/AllListingsCard\.module/g, "RovexoAllListingsCard.module"],
  [/ListingCard\.module/g, "RovexoListingCard.module"],
];

function transform(content) {
  let out = content;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function transformFile(relPath) {
  const full = join(root, relPath);
  if (!existsSync(full)) return;
  writeFileSync(full, transform(readFileSync(full, "utf8")));
}

ensureDir(join(root, "components/home/hooks"));

for (const [src, dest] of RENAMES) {
  copyRename(src, dest);
}

const premiumCss = join(root, "styles/rovexo/premium-2026.css");
const officialCss = join(root, "styles/rovexo-homepage.css");
if (existsSync(premiumCss)) {
  let css = readFileSync(premiumCss, "utf8");
  css = css.replace(/premium-page-home/g, "rovexo-page-home");
  css = css.replace(/ROVEXO HomePage v3\.0/g, "ROVEXO Homepage — Single Source of Truth");
  writeFileSync(officialCss, css);
}

for (const [, dest] of RENAMES) {
  transformFile(dest);
}

for (const rel of CONSUMER_FILES) {
  transformFile(rel);
}

ensureDir(archiveHome);
ensureDir(archivePremium);
ensureDir(archiveStyles);

for (const src of LEGACY_HOME_ARCHIVE) moveToArchive(src, archiveHome);
for (const src of LEGACY_PREMIUM_ARCHIVE) moveToArchive(src, archivePremium);
for (const src of RENAMES.map(([s]) => s)) {
  const full = join(root, src);
  if (existsSync(full)) rmSync(full, { force: true });
}
for (const src of LEGACY_STYLE_ARCHIVE) moveToArchive(src, archiveStyles);

const premiumDir = join(root, "components/premium");
if (existsSync(premiumDir)) {
  rmSync(premiumDir, { recursive: true, force: true });
}

console.log("Single Source of Truth migration complete.");
