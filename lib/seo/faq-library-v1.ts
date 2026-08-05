/**
 * P12 Wave A — Canonical FAQ library (single store).
 * Reuse by id across Help FAQ, category hubs, and cluster views.
 * No parallel FAQ systems.
 */

export type FaqCluster =
  | "global"
  | "buyer"
  | "seller"
  | "wallet"
  | "shipping"
  | "business"
  | "verification"
  | "safety"
  | "returns"
  | "category";

export type FaqLibraryEntry = {
  id: string;
  question: string;
  answer: string;
  clusters: readonly FaqCluster[];
  /** Catalog Master root slug(s) when category-specific. */
  categorySlugs?: readonly string[];
  helpHref?: string;
};

export const FAQ_LIBRARY_V1: readonly FaqLibraryEntry[] = [
  {
    id: "buyer-how-to-buy",
    question: "How do I buy on ROVEXO?",
    answer:
      "Find a listing, review photos and details, then tap Buy Now. Complete delivery and payment in ROVEXO Checkout. Keep chat on ROVEXO for purchase protection.",
    clusters: ["global", "buyer"],
    helpHref: "/help/buying-how-to-buy",
  },
  {
    id: "buyer-total-pays",
    question: "What is Total Buyer Pays?",
    answer:
      "Total Buyer Pays is the full amount at Checkout, including the item price, Platform Fee paid by the buyer, and applicable shipping — not the item price alone.",
    clusters: ["global", "buyer"],
    helpHref: "/help/buying-total-buyer-pays",
  },
  {
    id: "buyer-protection",
    question: "Does ROVEXO protect my purchase?",
    answer:
      "Eligible Checkout purchases include purchase protection for issues such as item not received or significantly not as described. Message the seller first, then use Support if needed.",
    clusters: ["global", "buyer", "safety"],
    helpHref: "/help/buying-buyer-protection",
  },
  {
    id: "buyer-offers",
    question: "How do offers and counter-offers work?",
    answer:
      "Use Make Offer on a listing or in Conversation Hub. Sellers can accept, decline, or counter. Pay only through ROVEXO after an accepted offer.",
    clusters: ["buyer"],
    helpHref: "/help/buying-make-offer",
  },
  {
    id: "seller-start",
    question: "How do I start selling?",
    answer:
      "Open Sell, add photos, title, description, category, price and parcel size, then Publish. One Personal Account can buy and sell — no separate seller account.",
    clusters: ["global", "seller"],
    helpHref: "/help/selling-get-started",
  },
  {
    id: "seller-fee",
    question: "What is the Seller Fee?",
    answer: "Seller Fee is £0. There is no seller commission on ROVEXO sales. Buyers pay the Platform Fee shown in Checkout.",
    clusters: ["global", "seller", "business"],
    helpHref: "/help/selling-fees",
  },
  {
    id: "seller-photos",
    question: "What photos should I use?",
    answer:
      "Use clear, well-lit photos of the actual item. Show flaws honestly. Poor or misleading photos can delay sales or trigger moderation.",
    clusters: ["seller"],
    helpHref: "/help/selling-photos",
  },
  {
    id: "wallet-balance",
    question: "Where is my Balance?",
    answer:
      "Open Balance from Profile (Wallet). Available Balance is what you can withdraw after protection timing and verification requirements.",
    clusters: ["global", "wallet", "seller"],
    helpHref: "/help/wallet-overview",
  },
  {
    id: "wallet-withdraw",
    question: "How long do withdrawals take?",
    answer:
      "After you request a withdraw to a verified bank account, timing depends on verification, fraud checks, and banking networks. Pending protection holds must clear first.",
    clusters: ["wallet", "seller"],
    helpHref: "/help/wallet-withdraw",
  },
  {
    id: "wallet-platform-fee",
    question: "Who pays the Platform Fee?",
    answer:
      "The buyer. Platform Fee is included in Total Buyer Pays at Checkout. Sellers do not pay a commission Seller Fee.",
    clusters: ["wallet", "buyer", "seller"],
    helpHref: "/help/payments-platform-fee",
  },
  {
    id: "shipping-who",
    question: "Who arranges shipping?",
    answer:
      "The seller fulfils the order using ROVEXO shipping and label flows for that order. Tracking appears in Orders and Conversation Hub when available.",
    clusters: ["shipping", "seller", "buyer"],
    helpHref: "/help/delivery-shipping",
  },
  {
    id: "shipping-track",
    question: "Where do I track my order?",
    answer: "Open Orders or the order’s Conversation Hub. Tracking updates appear when the seller ships and the carrier provides events.",
    clusters: ["shipping", "buyer"],
    helpHref: "/help/delivery-tracking",
  },
  {
    id: "shipping-address",
    question: "Can I change my address after payment?",
    answer:
      "Only while the order status still allows it. Contact the seller and Support immediately via Inbox — do not move the conversation off ROVEXO.",
    clusters: ["shipping", "buyer"],
    helpHref: "/help/shipping-change-address",
  },
  {
    id: "business-account-myth",
    question: "Do I need a separate business account to sell?",
    answer:
      "No. ROVEXO uses one Personal Account. Business or tax details are verification on your profile — not a different account type.",
    clusters: ["business", "seller"],
    helpHref: "/help/business-accounts-setup",
  },
  {
    id: "business-tax",
    question: "What is seller tax registration?",
    answer:
      "Before payouts, complete tax registration on your Personal Account (for example Personal, Sole Trader, or Company status for tax purposes) and add a bank account for withdrawals.",
    clusters: ["business", "wallet"],
    helpHref: "/help/seller-tax-registration",
  },
  {
    id: "verification-why",
    question: "Why does ROVEXO ask me to verify?",
    answer:
      "Verification protects buyers and sellers, reduces fraud, and unlocks payouts and higher trust. Follow the in-app steps and keep documents clear and current.",
    clusters: ["verification", "safety"],
    helpHref: "/help/verification-overview",
  },
  {
    id: "returns-how",
    question: "How do returns and refunds work?",
    answer:
      "Returns and refunds follow order status, delivery confirmation, and dispute outcomes. Keep evidence inside ROVEXO Messages and Orders.",
    clusters: ["returns", "buyer", "seller"],
    helpHref: "/help/payments-refunds",
  },
  {
    id: "safety-off-platform",
    question: "Can I pay outside ROVEXO?",
    answer:
      "No. Off-platform payment removes purchase protection and breaches ROVEXO policies. Always pay and chat inside the app.",
    clusters: ["safety", "global"],
    helpHref: "/help/safety-tips",
  },
  // Category-specific (Catalog Master roots)
  {
    id: "cat-womens-fashion",
    question: "What should I check when buying women's fashion on ROVEXO?",
    answer:
      "Confirm size, condition, brand, and measurements in photos. Ask the seller about flaws before you buy. Prefer tracked courier delivery for higher-value pieces.",
    clusters: ["category", "buyer"],
    categorySlugs: ["womens-fashion"],
    helpHref: "/help/guide-womens-fashion",
  },
  {
    id: "cat-mens-fashion",
    question: "How do I list men's fashion accurately?",
    answer:
      "Use clear photos, true size labels, and honest condition. Mention brand and material. Accurate titles help buyers find your item in Men's Fashion.",
    clusters: ["category", "seller"],
    categorySlugs: ["mens-fashion"],
    helpHref: "/help/guide-mens-fashion",
  },
  {
    id: "cat-designer",
    question: "How does ROVEXO handle designer and jewellery listings?",
    answer:
      "List only authentic items you own. Show hallmarks, serials, and packaging when available. Misleading designer claims can be removed and may affect your account.",
    clusters: ["category", "safety"],
    categorySlugs: ["jewellery"],
    helpHref: "/help/guide-designer",
  },
  {
    id: "cat-kids",
    question: "Are kids and baby items safe to buy second-hand?",
    answer:
      "Check for recalls, wear, and missing parts. Prefer items that meet UK safety expectations for children’s products. Ask sellers for age suitability and condition details.",
    clusters: ["category", "buyer"],
    categorySlugs: ["kids-fashion"],
    helpHref: "/help/guide-kids-baby",
  },
  {
    id: "cat-home",
    question: "What parcel size should I use for home and garden items?",
    answer:
      "Measure the packed item and choose the parcel option that fits. Oversize or fragile goods need honest packing notes so shipping labels and buyer expectations match.",
    clusters: ["category", "seller", "shipping"],
    categorySlugs: ["home-garden"],
    helpHref: "/help/guide-home-garden",
  },
  {
    id: "cat-electronics",
    question: "What should electronics listings include?",
    answer:
      "State working condition, included accessories, storage capacity, and any faults. Reset devices before shipping. Buyers should test on arrival and report issues via ROVEXO.",
    clusters: ["category", "buyer", "seller"],
    categorySlugs: ["electronics"],
    helpHref: "/help/guide-electronics",
  },
  {
    id: "cat-books",
    question: "How are books and media graded on ROVEXO?",
    answer:
      "Describe edition, wear, missing discs, or water damage honestly. Clear photos of spines and page edges help buyers choose with confidence.",
    clusters: ["category"],
    categorySlugs: ["books"],
    helpHref: "/help/guide-books-media",
  },
  {
    id: "cat-collectibles",
    question: "How do I list collectables fairly?",
    answer:
      "Note authenticity markers, set completeness, and condition grades. Avoid exaggerated rarity claims. High-value items should use tracked shipping.",
    clusters: ["category", "seller"],
    categorySlugs: ["collectibles"],
    helpHref: "/help/guide-collectables",
  },
  {
    id: "cat-sports",
    question: "What matters for sports and outdoors gear?",
    answer:
      "Share size, usage wear, and safety-critical details (for example helmets or climbing gear). Do not list damaged safety equipment as fully functional.",
    clusters: ["category"],
    categorySlugs: ["sports"],
    helpHref: "/help/guide-sports-outdoors",
  },
  {
    id: "cat-vehicle-parts",
    question: "What can I sell in Vehicle Parts & Accessories?",
    answer:
      "Courier-shippable parts and accessories only. Whole vehicles are not a ROVEXO catalogue root. Include fitment details (make, model, year) in the description.",
    clusters: ["category", "seller"],
    categorySlugs: ["vehicle-parts"],
    helpHref: "/help/guide-vehicle-parts",
  },
] as const;

export function getFaqByCluster(cluster: FaqCluster, limit = 8): FaqLibraryEntry[] {
  return FAQ_LIBRARY_V1.filter((entry) => entry.clusters.includes(cluster)).slice(0, limit);
}

export function getFaqByCategorySlug(categorySlug: string, limit = 6): FaqLibraryEntry[] {
  const root = categorySlug.trim().toLowerCase();
  const specific = FAQ_LIBRARY_V1.filter(
    (entry) => entry.categorySlugs?.includes(root) && entry.clusters.includes("category"),
  );
  const buyerSeller = [
    ...getFaqByCluster("buyer", 2),
    ...getFaqByCluster("seller", 1),
    ...getFaqByCluster("shipping", 1),
  ];
  const merged = [...specific, ...buyerSeller];
  const seen = new Set<string>();
  const unique: FaqLibraryEntry[] = [];
  for (const entry of merged) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    unique.push(entry);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function faqLibraryAsItems(
  entries: readonly FaqLibraryEntry[],
): { question: string; answer: string }[] {
  return entries.map((entry) => ({ question: entry.question, answer: entry.answer }));
}
