/**
 * P12 Wave A — Category hub editorial (Catalog Master roots).
 * Unique copy per root. Listings-first pages consume this after the grid.
 */

import type { CanonicalRootSlug } from "@/lib/categories/canonical-root-categories-v1";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";
import { getFaqByCategorySlug, faqLibraryAsItems } from "@/lib/seo/faq-library-v1";
import { waveACollectionLinksForCategory } from "@/lib/seo/wave-a-collections-v1";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";

export type CategoryHubEditorial = {
  rootSlug: CanonicalRootSlug;
  intro: string;
  buyingAdvice: readonly string[];
  sellingAdvice: readonly string[];
  guideLinks: InternalLinkGroup;
  collectionLinks: InternalLinkGroup;
  faqItems: { question: string; answer: string }[];
};

const EDITORIAL: Record<
  CanonicalRootSlug,
  Omit<CategoryHubEditorial, "rootSlug" | "guideLinks" | "collectionLinks" | "faqItems">
> = {
  "womens-fashion": {
    intro:
      "Shop women's fashion on ROVEXO from verified UK sellers — dresses, outerwear, accessories and more. Every eligible Checkout purchase includes purchase protection. Browse real listings first, then use the guides below if you are new to buying or selling fashion online.",
    buyingAdvice: [
      "Check size labels and measurements in photos before you buy.",
      "Ask about flaws, stains, or alterations in ROVEXO Messages.",
      "Prefer tracked delivery for higher-value pieces.",
    ],
    sellingAdvice: [
      "Photograph items in natural light on a clean background.",
      "State true size, brand, and condition in the title and description.",
      "Pack garments to avoid creasing and moisture in transit.",
    ],
  },
  "mens-fashion": {
    intro:
      "Discover men's fashion on ROVEXO — casual, formal and seasonal styles from UK sellers. Listings show price, condition and seller signals up front so you can decide quickly with confidence.",
    buyingAdvice: [
      "Confirm collar, waist, and shoe sizes against the seller’s notes.",
      "Review multiple photos for wear on cuffs, collars, and soles.",
      "Use Make Offer when the listing allows negotiation.",
    ],
    sellingAdvice: [
      "Include brand, size, and material in the first lines of the description.",
      "Disclose fading, pilling, or repairs honestly.",
      "Ship promptly after payment using ROVEXO shipping flows.",
    ],
  },
  jewellery: {
    intro:
      "Browse designer and jewellery listings on ROVEXO with secure Checkout. Authenticity and honest condition matter — only list items you own and can describe accurately.",
    buyingAdvice: [
      "Request clear photos of hallmarks, clasps, and serial details.",
      "Compare weight, packaging, and certificates when provided.",
      "Keep all payment on ROVEXO for protection.",
    ],
    sellingAdvice: [
      "Never list counterfeit designer goods.",
      "Show scale (ruler or coin) for small pieces.",
      "Use tracked, insured shipping appropriate to value.",
    ],
  },
  "kids-fashion": {
    intro:
      "Find kids and baby clothing and accessories from UK sellers on ROVEXO. Safety and honest condition come first — read descriptions carefully before you buy.",
    buyingAdvice: [
      "Check age suitability and for recalled product types.",
      "Inspect stitching, fastenings, and hygiene notes in photos.",
      "Ask whether items are from a smoke-free home if that matters to you.",
    ],
    sellingAdvice: [
      "Wash and photograph items clearly; note stains or wear.",
      "Include age range and brand sizing.",
      "Do not sell damaged safety-critical baby equipment as new.",
    ],
  },
  "home-garden": {
    intro:
      "Shop home and garden on ROVEXO — furniture, décor, tools and outdoor essentials from UK sellers. Choose parcel sizes that match packed dimensions so delivery goes smoothly.",
    buyingAdvice: [
      "Measure your space before buying furniture.",
      "Confirm whether items dismantle for shipping.",
      "Clarify collection vs courier in Messages when needed.",
    ],
    sellingAdvice: [
      "State dimensions and weight honestly.",
      "Protect corners and glass for transit.",
      "Pick the correct parcel tier at publish time.",
    ],
  },
  electronics: {
    intro:
      "Browse electronics on ROVEXO — phones, computers, audio and more from UK sellers. Working condition and included accessories should be clear before you pay.",
    buyingAdvice: [
      "Confirm storage, network lock status, and accessories.",
      "Ask for a short function demo photo or video when unsure.",
      "Test on arrival and report issues through ROVEXO promptly.",
    ],
    sellingAdvice: [
      "Factory-reset devices and remove accounts before shipping.",
      "List faults, battery health, and missing chargers.",
      "Use tracked shipping for all electronics.",
    ],
  },
  books: {
    intro:
      "Explore books and media on ROVEXO — books, music and film from UK sellers. Condition notes help collectors and readers buy with fewer surprises.",
    buyingAdvice: [
      "Check edition, ISBN, and disc inclusion in the description.",
      "Look for photos of spines and page edges.",
      "Ask about annotations or water damage before buying rare titles.",
    ],
    sellingAdvice: [
      "Grade condition clearly (for example like new, good, acceptable).",
      "Bundle series thoughtfully with accurate counts.",
      "Protect corners with cardboard when posting.",
    ],
  },
  collectibles: {
    intro:
      "Shop hobbies and collectables on ROVEXO — cards, coins, miniatures and more. Accurate authenticity notes and tracked delivery protect both sides of the sale.",
    buyingAdvice: [
      "Request close-ups of serials, seals, or grading labels.",
      "Compare set completeness against the listing.",
      "Prefer sellers with clear photos and ratings.",
    ],
    sellingAdvice: [
      "Avoid exaggerated rarity claims.",
      "Disclose restorations or reprints.",
      "Use rigid mailers or boxes for fragile pieces.",
    ],
  },
  sports: {
    intro:
      "Find sports and outdoors gear on ROVEXO — footwear, fitness and outdoor equipment from UK sellers. Safety-critical kit must be described honestly.",
    buyingAdvice: [
      "Confirm size and sport-specific standards.",
      "Ask about impact history on helmets and protective gear.",
      "Inspect bindings, straps, and soles in photos.",
    ],
    sellingAdvice: [
      "Never sell unsafe damaged protective equipment as fully functional.",
      "Clean gear and photograph wear points.",
      "Include brand and size in the title.",
    ],
  },
  "vehicle-parts": {
    intro:
      "Browse vehicle parts and accessories on ROVEXO — courier-shippable parts only. Whole vehicles are not a catalogue root. Include fitment details so buyers can match make, model and year.",
    buyingAdvice: [
      "Match OEM or aftermarket part numbers carefully.",
      "Confirm compatibility with your vehicle before paying.",
      "Ask about warranty or returns notes from the seller.",
    ],
    sellingAdvice: [
      "List make, model, year, and part number in the description.",
      "Do not list whole vehicles in this category.",
      "Drain fluids and pack heavy parts securely.",
    ],
  },
};

const GUIDE_HREF: Record<CanonicalRootSlug, { label: string; href: string }> = {
  "womens-fashion": { label: "Women's fashion guide", href: "/help/guide-womens-fashion" },
  "mens-fashion": { label: "Men's fashion guide", href: "/help/guide-mens-fashion" },
  jewellery: { label: "Designer & jewellery guide", href: "/help/guide-designer" },
  "kids-fashion": { label: "Kids & baby guide", href: "/help/guide-kids-baby" },
  "home-garden": { label: "Home & garden guide", href: "/help/guide-home-garden" },
  electronics: { label: "Electronics guide", href: "/help/guide-electronics" },
  books: { label: "Books & media guide", href: "/help/guide-books-media" },
  collectibles: { label: "Collectables guide", href: "/help/guide-collectables" },
  sports: { label: "Sports & outdoors guide", href: "/help/guide-sports-outdoors" },
  "vehicle-parts": { label: "Vehicle parts guide", href: "/help/guide-vehicle-parts" },
};

export function resolveRootSlugFromPath(slugPath: string[]): CanonicalRootSlug | null {
  const root = slugPath[0]?.trim().toLowerCase();
  if (!root) return null;
  const match = CANONICAL_ROOT_CATEGORIES.find((entry) => entry.slug === root);
  return match ? match.slug : null;
}

export function getCategoryHubEditorial(slugPath: string[]): CategoryHubEditorial | null {
  const rootSlug = resolveRootSlugFromPath(slugPath);
  if (!rootSlug) return null;
  const base = EDITORIAL[rootSlug];
  const guide = GUIDE_HREF[rootSlug];
  return {
    rootSlug,
    ...base,
    guideLinks: {
      title: "Guides",
      links: [
        guide,
        { label: "How to buy", href: "/help/buying-how-to-buy" },
        { label: "Start selling", href: "/help/selling-get-started" },
        { label: "Help Centre", href: "/help" },
      ].slice(0, 4),
    },
    collectionLinks: waveACollectionLinksForCategory(rootSlug),
    faqItems: faqLibraryAsItems(getFaqByCategorySlug(rootSlug, 6)),
  };
}
