import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal/document-shared";
import {
  formatFaqMarkdown,
  formatLinkList,
  renderProductCategoryManual,
  type FaqEntry,
  type ProductCategoryManual,
} from "@/lib/documentation/documentation-engine-v1";
import { WEAPONS_CATEGORY } from "@/lib/documentation/prohibited/weapons-v1";
import {
  COSMETICS_CATEGORY,
  MEDICINES_CATEGORY,
} from "@/lib/documentation/prohibited/medicines-cosmetics-v1";
import {
  ELECTRONICS_CATEGORY,
  VEHICLES_CATEGORY,
} from "@/lib/documentation/prohibited/electronics-vehicles-v1";
import {
  ADULT_CATEGORY,
  ANIMALS_CATEGORY,
  DIGITAL_CATEGORY,
  HOME_CATEGORY,
  ILLEGAL_CATEGORY,
  SAFETY_CATEGORY,
} from "@/lib/documentation/prohibited/home-animals-digital-adult-illegal-safety-v1";

export const PROHIBITED_RESTRICTED_CATEGORIES: ProductCategoryManual[] = [
  WEAPONS_CATEGORY,
  MEDICINES_CATEGORY,
  COSMETICS_CATEGORY,
  ELECTRONICS_CATEGORY,
  VEHICLES_CATEGORY,
  HOME_CATEGORY,
  ANIMALS_CATEGORY,
  DIGITAL_CATEGORY,
  ADULT_CATEGORY,
  ILLEGAL_CATEGORY,
  SAFETY_CATEGORY,
];

const GLOBAL_FAQS: FaqEntry[] = [
  {
    question: "What are the three product states on ROVEXO?",
    answer: "Allowed, Restricted, and Prohibited. There is no fourth state.",
  },
  {
    question: "Can I sell a kitchen knife?",
    answer: "Yes as a cooking tool with honest kitchen-context photos. Weapon marketing is not Allowed.",
  },
  {
    question: "Can I sell an airsoft gun?",
    answer: "Only UK-compliant sports airsoft under Restricted review. Realistic prohibited imitations are Prohibited.",
  },
  {
    question: "Can I sell a drone?",
    answer: "Lawful consumer drones may be Allowed/Restricted with honest description. Illegal surveillance or weaponised kits are Prohibited.",
  },
  {
    question: "Can I sell opened perfume?",
    answer: "Restricted with clear fill-level disclosure. Counterfeit perfume is Prohibited.",
  },
  {
    question: "Can I sell an expired cosmetic?",
    answer: "No. Expired cosmetics are Prohibited.",
  },
  {
    question: "Can I sell a modified ECU?",
    answer: "Restricted with full disclosure. Illegal emissions defeat devices are Prohibited.",
  },
  {
    question: "Can I sell fireworks?",
    answer: "No. Fireworks and explosives are Prohibited.",
  },
  {
    question: "Can I sell CBD oil?",
    answer: "Only lawful consumer CBD under Restricted review with no medicinal cure claims. THC cannabis products are Prohibited.",
  },
  {
    question: "Can I sell a recalled charger?",
    answer: "No. Recalled electronics are Prohibited.",
  },
  {
    question: "Can I sell live animals?",
    answer: "No. Live animals are Prohibited.",
  },
  {
    question: "Can I sell my car as a whole vehicle?",
    answer: "No. Whole vehicles are Prohibited. Eligible vehicle parts may be listed under Vehicle Parts & Accessories.",
  },
  {
    question: "Can I sell prescription medicine?",
    answer: "No. Prescription medicines are Prohibited.",
  },
  {
    question: "Can I sell pepper spray?",
    answer: "No. Pepper spray, CS spray, tasers and stun guns are Prohibited.",
  },
  {
    question: "What happens if I list a Prohibited item?",
    answer: "The listing is blocked or removed. Your account may be suspended. Serious cases may be reported to authorities.",
  },
  {
    question: "How do I appeal a moderation decision?",
    answer: "Open Contact Support, choose an appeal topic, and include the listing URL and evidence. See Help → Reports & Appeals.",
  },
];

function countProducts(): { products: number; faqs: number } {
  let products = 0;
  let faqs = GLOBAL_FAQS.length;
  for (const category of PROHIBITED_RESTRICTED_CATEGORIES) {
    products += category.products.length;
    faqs += category.faqs.length;
    for (const item of category.products) {
      faqs += item.faq?.length ?? 0;
      // Auto FAQ per product: "Can I sell {name}?"
      faqs += 1;
    }
  }
  return { products, faqs };
}

function renderAutoProductFaqs(category: ProductCategoryManual): string {
  const faqs: FaqEntry[] = category.products.map((item) => ({
    question: `Can I sell ${item.name}?`,
    answer: `${item.name} is **${item.classification === "allowed" ? "Allowed" : item.classification === "restricted" ? "Restricted" : "Prohibited"}** on ROVEXO. ${item.marketplaceRule}`,
  }));
  return formatFaqMarkdown(faqs);
}

export function getProhibitedRestrictedStats() {
  return {
    categories: PROHIBITED_RESTRICTED_CATEGORIES.length,
    ...countProducts(),
  };
}

export function buildProhibitedRestrictedItemsPolicyMarkdown(): string {
  const categoriesMarkdown = PROHIBITED_RESTRICTED_CATEGORIES.map((category) => {
    const base = renderProductCategoryManual(category);
    return `${base}

### Additional product FAQs — ${category.title}

${renderAutoProductFaqs(category)}
`;
  }).join("\n\n");
  const stats = getProhibitedRestrictedStats();

  return `# Prohibited & Restricted Items Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Introduction

**What:** This document is ROVEXO’s official marketplace compliance manual for what may be listed, sold, shipped, or discussed for sale on the platform.

**Why:** Buyers, sellers, carriers, and the public must be protected from illegal, unsafe, and fraudulent goods.

**Important:** Every product on ROVEXO belongs to exactly one state — **Allowed**, **Restricted**, or **Prohibited**. There is no fourth state.

## 2. Purpose

**What:** Explain classifications in depth, category by category and product by product, so a first-time user knows what is allowed, what is prohibited, how enforcement works, and where to go next.

**How:** Read the classification rules, then the category manuals, then the individual product rules and FAQs.

## 3. Who this applies to

**What:** Every ROVEXO Personal Account — buyers, sellers, and anyone messaging about a potential sale.

**Notes:** Business tax registration status on a Personal Account does not create a separate permission to sell Prohibited items.

## 4. Definitions

**What:**

- **Allowed** — may be listed when descriptions, photos, and shipping are honest and lawful.
- **Restricted** — may be listed only with extra disclosures, age/safety/shipping conditions, and often manual review. ROVEXO may still refuse the listing.
- **Prohibited** — must not be listed, sold, or arranged on ROVEXO. Attempts may lead to removal, suspension, and reporting.
- **Seller Fee** — £0 on ROVEXO. Classification is not a fee category.
- **Platform Fee** — paid by the buyer at Checkout; unrelated to whether an item is Allowed.

## 5. Detailed explanation — classification system

**How:** Before publishing, ask: Is this illegal to sell publicly in the UK? Is it unsafe or recalled? Is it a weapon, medicine, live animal, whole vehicle, or fraud tool? If yes to serious risk → treat as Prohibited. If borderline → Restricted and disclose everything. Otherwise → Allowed with honesty.

**Example:** A chef knife sold as cookware is Allowed. The same blade marketed as a combat weapon is treated as Prohibited misuse of the listing.

**Notes:** This manual currently catalogues **${stats.products}** individually classified products across **${stats.categories}** category manuals, plus **${stats.faqs}** FAQ entries including category and product FAQs.

## 6. Step-by-step guidance for sellers

**How:**

1. Identify the product honestly (real photos, real title).
2. Find the matching category and product rule below.
3. If **Prohibited** — stop. Do not list.
4. If **Restricted** — add required disclosures (condition, legality, locks, expiry, provenance).
5. Publish via Sell and wait for any moderation hold.
6. Ship only with carriers that accept the item.
7. If removed — use Contact Support to appeal with evidence.

## 7. Examples

**Example:** Sealed authentic perfume → generally Allowed. Opened perfume → Restricted with fill level. Counterfeit perfume → Prohibited.

**Example:** Phone with clear ownership → Allowed. IMEI blocked phone → Prohibited. Cloud-locked phone sold as “fully working” → Prohibited misrepresentation.

## 8. Common mistakes

**What:** Renaming Prohibited items, cropping weapons photos, moving payment off ROVEXO, selling recalled chargers, listing whole cars under parts, selling leftover antibiotics, and using “replica” to mean counterfeit.

## 9. AI Moderation on ROVEXO

**What:** ROVEXO uses automated and human review together.

**How:**

- **Title Analysis** — keywords and patterns for weapons, medicines, fraud, live animals, whole vehicles.
- **Description Analysis** — hidden service offers, off-platform payment requests, code words.
- **Image Analysis** — visual cues for firearms, IDs, NSFW, live animals, whole vehicles.
- **Brand Detection** — counterfeit luxury and electronics signals.
- **Duplicate Detection** — repeated scam or banned inventory patterns.
- **Keyword Detection** — high-risk terms auto-score listings.
- **Risk Scoring** — combines signals into allow, review, or block.
- **Manual Review** — Restricted and ambiguous cases go to human moderators.
- **Automatic Blocking** — clear Prohibited classes may never go live.
- **Appeals** — Contact Support with listing URL and evidence; see Help → Reports & Appeals.

**Important:** Evading AI detection is itself a policy breach.

${categoriesMarkdown}

## 10. Platform-wide Frequently Asked Questions

${formatFaqMarkdown(GLOBAL_FAQS)}

## 11. Common questions

- **Is Seller Fee charged because an item is Restricted?** No. Seller Fee is £0. The buyer pays Platform Fee at Checkout on eligible purchases.
- **Does Restricted mean guaranteed approval?** No. Restricted means extra conditions and possible refusal.
- **Where do I report a dangerous listing?** Use Report Listing on the product and/or Contact Support.
- **Where is the Help handbook for safety?** [Safety & Trust](/help/category/safety) and [Reports & Appeals](/help/category/reports).

## 12. Related Documents

${formatLinkList([
  { title: "Acceptable Use Policy", href: "/legal/acceptable-use-policy" },
  { title: "Community Guidelines", href: "/legal/community-guidelines" },
  { title: "Seller Terms", href: "/legal/seller-terms" },
  { title: "Buyer Terms", href: "/legal/buyer-terms" },
  { title: "Shipping Policy", href: "/legal/shipping-policy" },
  { title: "Intellectual Property & Notice and Takedown Policy", href: "/legal/intellectual-property-policy" },
  { title: "Account Suspension Policy", href: "/legal/account-suspension-policy" },
  { title: "Terms & Conditions", href: "/legal/terms-and-conditions" },
  { title: "Help Centre", href: "/help" },
  { title: "Help Centre — Safety", href: "/help/category/safety" },
  { title: "Help Centre — Seller", href: "/help/category/seller" },
  { title: "Help Centre — Reports & Appeals", href: "/help/category/reports" },
  { title: "Help Centre — Buyer", href: "/help/category/buyer" },
  { title: "Contact Support", href: "/support" },
])}
`;
}
