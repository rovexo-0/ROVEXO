import type { RovexoBusiness } from "@/components/home/constants";
import type { Product, ProductsPage, ProductDetail } from "@/lib/products/types";
import {
  buildShowcaseSellerSections,
  type ShowcaseSellerSection,
} from "@/lib/homepage/showcase-sellers";
import {
  compareHomepageFeedProducts,
  computeHomepagePriorityScore,
} from "@/lib/homepage/feed-ranking";
import { filterHomepageProducts } from "@/lib/homepage/homepage-eligibility";
import { resolveHomepageMode } from "@/lib/homepage/config";
import { resolveOfficialDemoProductImage } from "@/lib/media/official-demo-images";

const DEMO_MIN_COUNT = 12;

/** Demo catalogue padding is opt-in only (set ROVEXO_HOMEPAGE_DEMO=1). Production hides empty sections. */
const HOMEPAGE_DEMO_ENABLED = resolveHomepageMode() === "demo";

const demoImage = (seed: string) => resolveOfficialDemoProductImage(seed);

function baseDemoProduct(
  partial: Pick<Product, "id" | "slug" | "title" | "price" | "imageUrl" | "brand"> &
    Partial<Product>,
): Product {
  return {
    condition: "Excellent",
    sellerName: partial.sellerName ?? "ROVEXO Seller",
    sellerId: partial.sellerId ?? partial.id,
    sellerVerified: partial.sellerVerified ?? true,
    sellerTier: partial.sellerTier ?? "standard",
    rating: partial.rating ?? 4.8,
    reviewCount: partial.reviewCount ?? 96,
    views: partial.views ?? 248,
    sections: partial.sections ?? ["popular"],
    isFeatured: partial.isFeatured ?? false,
    isBumped: partial.isBumped ?? false,
    ...partial,
  };
}

export const HOMEPAGE_DEMO_PRODUCTS: Product[] = [
  baseDemoProduct({
    id: "demo-vehicle-1",
    slug: "demo-audi-a3-sportback",
    title: "Audi A3 Sportback 2.0 TDI",
    price: 12450,
    brand: "Vehicles",
    imageUrl: demoImage("car-01.jpg"),
    isFeatured: true,
    views: 412,
    rating: 4.9,
  }),
  baseDemoProduct({
    id: "demo-phone-1",
    slug: "demo-iphone-15-pro",
    title: "iPhone 15 Pro 256GB Natural Titanium",
    price: 899,
    brand: "Phones",
    imageUrl: demoImage("phone-01.jpg"),
    isFeatured: true,
    isBumped: true,
    views: 638,
  }),
  baseDemoProduct({
    id: "demo-electronics-1",
    slug: "demo-sony-headphones",
    title: "Sony WH-1000XM5 Noise Cancelling",
    price: 249,
    brand: "Electronics",
    imageUrl: demoImage("headphones-01.jpg"),
    isBumped: true,
    views: 521,
  }),
  baseDemoProduct({
    id: "demo-gaming-1",
    slug: "demo-ps5-console",
    title: "PlayStation 5 Console Disc Edition",
    price: 429,
    brand: "Gaming",
    imageUrl: demoImage("ps5-01.jpg"),
    isFeatured: true,
    sellerTier: "premium",
    views: 902,
    rating: 5,
    reviewCount: 214,
  }),
  baseDemoProduct({
    id: "demo-fashion-1",
    slug: "demo-designer-jacket",
    title: "Premium Wool Blend Overcoat",
    price: 185,
    brand: "Fashion",
    imageUrl: demoImage("jacket-01.jpg"),
    sections: ["recommended"],
    sellerTier: "premium",
  }),
  baseDemoProduct({
    id: "demo-home-1",
    slug: "demo-scandi-sofa",
    title: "Scandinavian Linen Corner Sofa",
    price: 690,
    brand: "Home",
    imageUrl: demoImage("sofa-01.jpg"),
    sections: ["new"],
    views: 177,
  }),
  baseDemoProduct({
    id: "demo-luxury-1",
    slug: "demo-luxury-watch",
    title: "Certified Pre-Owned Luxury Chronograph",
    price: 3200,
    brand: "Luxury",
    imageUrl: demoImage("watch-01.jpg"),
    listingType: "luxury",
    sellerTier: "premium",
    sellerVerified: true,
    rating: 5,
    reviewCount: 88,
    views: 334,
  }),
  baseDemoProduct({
    id: "demo-furniture-1",
    slug: "demo-oak-dining-table",
    title: "Solid Oak Dining Table Seats 6",
    price: 540,
    brand: "Furniture",
    imageUrl: demoImage("table-01.jpg"),
    sections: ["new"],
    isBumped: true,
  }),
  baseDemoProduct({
    id: "demo-property-1",
    slug: "demo-modern-apartment",
    title: "Modern 2 Bed Apartment City Centre",
    price: 285000,
    brand: "Property",
    imageUrl: demoImage("apartment-01.jpg"),
    isFeatured: true,
    listingType: "business",
    sellerTier: "business",
    sellerName: "Harbour Estates",
  }),
  baseDemoProduct({
    id: "demo-sports-1",
    slug: "demo-carbon-road-bike",
    title: "Carbon Road Bike Shimano 105",
    price: 1150,
    brand: "Sports",
    imageUrl: demoImage("bike-01.jpg"),
    sections: ["recommended"],
    isBumped: true,
    views: 289,
  }),
  baseDemoProduct({
    id: "demo-pets-1",
    slug: "demo-dog-accessory-bundle",
    title: "Premium Dog Bed & Travel Crate Bundle",
    price: 79,
    brand: "Pets",
    imageUrl: demoImage("pets-01.jpg"),
    sections: ["new"],
    views: 143,
  }),
  baseDemoProduct({
    id: "demo-computer-1",
    slug: "demo-macbook-pro-m3",
    title: 'MacBook Pro 14" M3 Pro 18GB 512GB',
    price: 1699,
    brand: "Computers",
    imageUrl: demoImage("laptop-01.jpg"),
    isFeatured: true,
    isBumped: true,
    sellerTier: "premium",
    views: 764,
    rating: 4.9,
    reviewCount: 152,
  }),
  baseDemoProduct({
    id: "demo-electronics-2",
    slug: "demo-smart-tv",
    title: 'Samsung 55" QLED 4K Smart TV',
    price: 649,
    brand: "Electronics",
    imageUrl: demoImage("tv-01.jpg"),
    sections: ["popular"],
    isBumped: true,
  }),
  baseDemoProduct({
    id: "demo-fashion-2",
    slug: "demo-designer-handbag",
    title: "Designer Leather Crossbody Bag",
    price: 420,
    brand: "Fashion",
    imageUrl: demoImage("handbag-01.jpg"),
    sellerTier: "premium",
    sections: ["recommended"],
    rating: 4.7,
    reviewCount: 61,
  }),
  baseDemoProduct({
    id: "demo-gaming-2",
    slug: "demo-gaming-chair",
    title: "Ergonomic Pro Gaming Chair",
    price: 219,
    brand: "Gaming",
    imageUrl: demoImage("chair-01.jpg"),
    sections: ["popular"],
    sellerTier: "premium",
    views: 198,
  }),
  baseDemoProduct({
    id: "demo-shoes-1",
    slug: "demo-nike-air-max",
    title: "Nike Air Max 90 UK Size 9",
    price: 95,
    brand: "Shoes",
    imageUrl: demoImage("shoes-01.jpg"),
    sections: ["popular", "new"],
    isBumped: true,
    views: 412,
    rating: 4.8,
  }),
  baseDemoProduct({
    id: "demo-jewellery-1",
    slug: "demo-gold-necklace",
    title: "18K Gold Cuban Link Chain 20in",
    price: 890,
    brand: "Jewellery",
    imageUrl: demoImage("necklace-01.jpg"),
    listingType: "luxury",
    sellerVerified: true,
    views: 267,
    rating: 4.9,
    reviewCount: 42,
  }),
  baseDemoProduct({
    id: "demo-garden-1",
    slug: "demo-patio-furniture-set",
    title: "Rattan Garden Sofa Set with Table",
    price: 449,
    brand: "Garden",
    imageUrl: demoImage("patio-01.jpg"),
    sections: ["recommended"],
    isFeatured: true,
    views: 318,
  }),
  baseDemoProduct({
    id: "demo-shoes-2",
    slug: "demo-designer-heels",
    title: "Designer Leather Heels Size 6",
    price: 165,
    brand: "Shoes",
    imageUrl: demoImage("heels-01.jpg"),
    sellerTier: "premium",
    sections: ["recommended"],
    views: 201,
  }),
  baseDemoProduct({
    id: "demo-jewellery-2",
    slug: "demo-diamond-studs",
    title: "Diamond Stud Earrings 0.5ct TW",
    price: 1250,
    brand: "Jewellery",
    imageUrl: demoImage("earrings-01.jpg"),
    listingType: "luxury",
    isFeatured: true,
    sellerVerified: true,
    views: 445,
  }),
  baseDemoProduct({
    id: "demo-garden-2",
    slug: "demo-lawn-mower",
    title: "Cordless Lawn Mower 40V with Battery",
    price: 279,
    brand: "Garden",
    imageUrl: demoImage("mower-01.jpg"),
    sections: ["new"],
    isBumped: true,
    views: 156,
  }),
];

const HOMEPAGE_DEMO_BUSINESSES: RovexoBusiness[] = [
  {
    id: "biz-demo-1",
    name: "TechVault Pro",
    slug: "techvault-pro",
    logoUrl: demoImage("business-01.jpg"),
    verified: true,
    category: "Electronics",
    listingCount: 128,
    href: "/search?category=electronics",
  },
  {
    id: "biz-demo-2",
    name: "Luxe Collective",
    slug: "luxe-collective",
    logoUrl: demoImage("business-02.jpg"),
    verified: true,
    category: "Luxury",
    listingCount: 64,
    href: "/search?category=luxury",
  },
  {
    id: "biz-demo-3",
    name: "Urban Motors",
    slug: "urban-motors",
    logoUrl: demoImage("business-03.jpg"),
    verified: true,
    category: "Vehicles",
    listingCount: 42,
    href: "/search?category=vehicles",
  },
  {
    id: "biz-demo-4",
    name: "Green Garden Co.",
    slug: "green-garden",
    logoUrl: demoImage("business-04.jpg"),
    verified: true,
    category: "Home & Garden",
    listingCount: 89,
    href: "/search?category=home-garden",
  },
  {
    id: "biz-demo-5",
    name: "Pixel Phones UK",
    slug: "pixel-phones-uk",
    logoUrl: demoImage("business-05.jpg"),
    verified: true,
    category: "Phones",
    listingCount: 156,
    href: "/search?category=phones",
  },
  {
    id: "biz-demo-6",
    name: "GameGrid Store",
    slug: "gamegrid-store",
    logoUrl: demoImage("business-06.jpg"),
    verified: true,
    category: "Gaming",
    listingCount: 73,
    href: "/search?category=gaming",
  },
  {
    id: "biz-demo-7",
    name: "Style Avenue",
    slug: "style-avenue",
    logoUrl: demoImage("business-07.jpg"),
    verified: true,
    category: "Fashion",
    listingCount: 201,
    href: "/search?category=womens-fashion",
  },
  {
    id: "biz-demo-8",
    name: "ProFit Gear",
    slug: "profit-gear",
    logoUrl: demoImage("business-08.jpg"),
    verified: true,
    category: "Sports",
    listingCount: 54,
    href: "/search?category=sports",
  },
  {
    id: "biz-demo-9",
    name: "PawPlanet",
    slug: "pawplanet",
    logoUrl: demoImage("business-09.jpg"),
    verified: true,
    category: "Pets",
    listingCount: 37,
    href: "/search?category=pets",
  },
  {
    id: "biz-demo-10",
    name: "Compute Central",
    slug: "compute-central",
    logoUrl: demoImage("business-10.jpg"),
    verified: true,
    category: "Computers",
    listingCount: 112,
    href: "/search?category=computers",
  },
  {
    id: "biz-demo-11",
    name: "Harbour Estates",
    slug: "harbour-estates",
    logoUrl: demoImage("business-11.jpg"),
    verified: true,
    category: "Property",
    listingCount: 28,
    href: "/search?category=property",
  },
  {
    id: "biz-demo-12",
    name: "Craft & DIY Hub",
    slug: "craft-diy-hub",
    logoUrl: demoImage("business-12.jpg"),
    verified: true,
    category: "DIY",
    listingCount: 66,
    href: "/search?category=diy",
  },
];

function uniqueById(products: Product[]): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const product of products) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
  }
  return result;
}

function mergeProducts(
  primary: Product[],
  preferred: Product[],
  fallback: Product[],
  min = DEMO_MIN_COUNT,
): Product[] {
  const merged = uniqueById([...primary, ...preferred, ...fallback, ...HOMEPAGE_DEMO_PRODUCTS]);
  return merged.slice(0, min);
}

/** Dedicated Showcase sellers for visual certification when live DB has no featured placements. */
export const HOMEPAGE_DEMO_SHOWCASE_PRODUCTS: Product[] = [
  baseDemoProduct({
    id: "showcase-demo-1",
    slug: "showcase-demo-techvault-phone",
    sellerId: "showcase-seller-techvault",
    sellerName: "TechVault Pro",
    sellerUsername: "techvault-pro",
    sellerAvatar: demoImage("business-01.jpg"),
    sellerTier: "business",
    title: "iPhone 15 Pro 256GB Natural Titanium",
    price: 899,
    brand: "Phones",
    imageUrl: demoImage("phone-01.jpg"),
    isFeatured: true,
    views: 1204,
    rating: 4.9,
    reviewCount: 186,
  }),
  baseDemoProduct({
    id: "showcase-demo-1b",
    slug: "showcase-demo-techvault-headphones",
    sellerId: "showcase-seller-techvault",
    sellerName: "TechVault Pro",
    sellerUsername: "techvault-pro",
    sellerAvatar: demoImage("business-01.jpg"),
    sellerTier: "business",
    title: "Sony WH-1000XM5 Noise Cancelling",
    price: 249,
    brand: "Electronics",
    imageUrl: demoImage("headphones-01.jpg"),
    isFeatured: true,
    views: 802,
  }),
  baseDemoProduct({
    id: "showcase-demo-2",
    slug: "showcase-demo-luxe-watch",
    sellerId: "showcase-seller-luxe",
    sellerName: "Luxe Collective",
    sellerUsername: "luxe-collective",
    sellerAvatar: demoImage("business-02.jpg"),
    sellerTier: "premium",
    title: "Certified Pre-Owned Luxury Chronograph",
    price: 3200,
    brand: "Luxury",
    imageUrl: demoImage("watch-01.jpg"),
    isFeatured: true,
    listingType: "luxury",
    views: 534,
    rating: 5,
    reviewCount: 88,
  }),
  baseDemoProduct({
    id: "showcase-demo-2b",
    slug: "showcase-demo-luxe-handbag",
    sellerId: "showcase-seller-luxe",
    sellerName: "Luxe Collective",
    sellerUsername: "luxe-collective",
    sellerAvatar: demoImage("business-02.jpg"),
    sellerTier: "premium",
    title: "Designer Leather Crossbody Bag",
    price: 420,
    brand: "Fashion",
    imageUrl: demoImage("handbag-01.jpg"),
    isFeatured: true,
    views: 291,
  }),
  baseDemoProduct({
    id: "showcase-demo-3",
    slug: "showcase-demo-gamegrid-ps5",
    sellerId: "showcase-seller-gamegrid",
    sellerName: "GameGrid Store",
    sellerUsername: "gamegrid-store",
    sellerAvatar: demoImage("business-06.jpg"),
    sellerTier: "business",
    title: "PlayStation 5 Console Disc Edition",
    price: 429,
    brand: "Gaming",
    imageUrl: demoImage("ps5-01.jpg"),
    isFeatured: true,
    views: 991,
    rating: 4.8,
    reviewCount: 142,
  }),
];

export function resolveShowcaseSections(
  fromDb: ShowcaseSellerSection[],
  feedItems: Product[],
): ShowcaseSellerSection[] {
  if (fromDb.length > 0) return fromDb;

  const fromFeed = buildShowcaseSellerSections(feedItems);
  if (fromFeed.length > 0) return fromFeed;

  if (!HOMEPAGE_DEMO_ENABLED) return [];

  return buildShowcaseSellerSections(HOMEPAGE_DEMO_SHOWCASE_PRODUCTS);
}

const DEMO_LISTING_GALLERY_SEEDS = [
  "phone-01.jpg",
  "headphones-01.jpg",
  "laptop-01.jpg",
  "watch-01.jpg",
  "shoes-01.jpg",
  "jacket-01.jpg",
  "handbag-01.jpg",
  "tv-01.jpg",
] as const;

function demoGalleryImages(): string[] {
  return DEMO_LISTING_GALLERY_SEEDS.map((seed) => demoImage(seed));
}

function findDemoCatalogProduct(slug: string): Product | undefined {
  return [...HOMEPAGE_DEMO_PRODUCTS, ...HOMEPAGE_DEMO_SHOWCASE_PRODUCTS].find(
    (item) => item.slug === slug,
  );
}

export function resolveDemoProductDetail(slug: string): ProductDetail | null {
  if (!HOMEPAGE_DEMO_ENABLED) return null;
  const product = findDemoCatalogProduct(slug);
  if (!product) return null;

  return {
    ...product,
    images: demoGalleryImages(),
    description: `Buy ${product.title} on ROVEXO with purchase protection and verified sellers.`,
    salesCount: product.reviewCount ?? 0,
    sellerFollowerCount: 128,
    deliveryCarriers: ["Royal Mail", "Evri", "DPD"],
    freeDelivery: false,
    shippingPrice: 4.99,
    stock: 3,
    availability: "in_stock",
    sellerId: product.sellerId ?? product.id,
    transactionMode: "MARKETPLACE",
  };
}

/** Pad demo listing galleries for visual certification when live rows have few photos. */
export function enrichDemoProductDetail(slug: string, detail: ProductDetail | null): ProductDetail | null {
  const demo = resolveDemoProductDetail(slug);
  if (!demo) return detail;
  if (!detail) return demo;
  if ((detail.images?.length ?? 0) >= 2) return detail;
  return { ...detail, images: demo.images };
}

export function resolveDemoSimilarProducts(slug: string, limit = 8): Product[] {
  if (!HOMEPAGE_DEMO_ENABLED) return [];
  return [...HOMEPAGE_DEMO_PRODUCTS, ...HOMEPAGE_DEMO_SHOWCASE_PRODUCTS]
    .filter((product) => product.slug !== slug)
    .slice(0, limit);
}

function mergeBusinesses(primary: RovexoBusiness[], fallback: RovexoBusiness[]): RovexoBusiness[] {
  const seen = new Set<string>();
  const merged: RovexoBusiness[] = [];
  for (const business of [...primary, ...fallback, ...HOMEPAGE_DEMO_BUSINESSES]) {
    if (seen.has(business.id)) continue;
    seen.add(business.id);
    merged.push(business);
    if (merged.length >= DEMO_MIN_COUNT) break;
  }
  return merged;
}

export type HomepageEnrichedData = {
  featured: Product[];
  recommended: Product[];
  newListings: Product[];
  boostListings: Product[];
  premiumListings: Product[];
  businesses: RovexoBusiness[];
};

export function resolveHomepageFeedItems(feed: ProductsPage): ProductsPage {
  const filtered = filterHomepageProducts(feed.items);

  if (filtered.length > 0) {
    return {
      ...feed,
      items: [...filtered]
        .map((product) => ({
          ...product,
          homepagePriorityScore: computeHomepagePriorityScore(product),
        }))
        .sort(compareHomepageFeedProducts),
    };
  }

  if (!HOMEPAGE_DEMO_ENABLED) {
    return feed;
  }

  const items = [...HOMEPAGE_DEMO_PRODUCTS]
    .map((product) => ({
      ...product,
      homepagePriorityScore: computeHomepagePriorityScore(product),
    }))
    .sort(compareHomepageFeedProducts)
    .slice(0, 12);

  return {
    items,
    page: 1,
    hasMore: true,
  };
}

/** @deprecated Homepage v1.0 uses a single All Listings feed — use resolveHomepageFeedItems. */
export function enrichHomepageData(input: {
  featured: Product[];
  recommended: Product[];
  newListings: Product[];
  popularListings: Product[];
}): HomepageEnrichedData {
  const pool = uniqueById([
    ...input.featured,
    ...input.recommended,
    ...input.newListings,
    ...input.popularListings,
    ...(HOMEPAGE_DEMO_ENABLED ? HOMEPAGE_DEMO_PRODUCTS : []),
  ]);

  const businessesFromProducts = pool
    .filter((product) => product.sellerTier === "business" || product.listingType === "business")
    .map((product) => ({
      id: product.sellerId ?? product.id,
      name: product.sellerName,
      slug: product.slug,
      logoUrl: product.sellerAvatar || product.imageUrl,
      verified: Boolean(product.sellerVerified),
      category: product.brand ?? "Business",
      listingCount: 24,
      href: product.sellerId
        ? `/search?seller=${encodeURIComponent(product.sellerId)}`
        : "/search?category=business",
    }));

  if (!HOMEPAGE_DEMO_ENABLED) {
    return {
      featured: uniqueById(input.featured),
      recommended: uniqueById(input.recommended),
      newListings: uniqueById(input.newListings),
      boostListings: uniqueById(pool.filter((product) => product.isBumped)),
      premiumListings: uniqueById(
        pool.filter(
          (product) => product.sellerTier === "premium" || product.listingType === "premium",
        ),
      ),
      businesses: businessesFromProducts,
    };
  }

  const featuredPreferred = pool.filter((product) => product.isFeatured);
  const boostPreferred = pool.filter((product) => product.isBumped);
  const premiumPreferred = pool.filter(
    (product) => product.sellerTier === "premium" || product.listingType === "premium",
  );

  return {
    featured: mergeProducts(input.featured, featuredPreferred, HOMEPAGE_DEMO_PRODUCTS),
    recommended: mergeProducts(
      input.recommended,
      pool.filter((p) => p.sections.includes("recommended")),
      HOMEPAGE_DEMO_PRODUCTS,
    ),
    newListings: mergeProducts(
      input.newListings,
      pool.filter((p) => p.sections.includes("new")),
      HOMEPAGE_DEMO_PRODUCTS,
    ),
    boostListings: mergeProducts([], boostPreferred, HOMEPAGE_DEMO_PRODUCTS.filter((p) => p.isBumped)),
    premiumListings: mergeProducts(
      [],
      premiumPreferred,
      HOMEPAGE_DEMO_PRODUCTS.filter((p) => p.sellerTier === "premium"),
    ),
    businesses: mergeBusinesses(businessesFromProducts, HOMEPAGE_DEMO_BUSINESSES),
  };
}
