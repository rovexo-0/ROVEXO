/**
 * ROVEXO Help Centre — Category Hub Handbooks v1.0
 * Documentation Engine master template (Owner Master Documentation Spec).
 */

import {
  wrapMasterHelpDocument,
  type DocLink,
  type FaqEntry,
} from "@/lib/documentation/documentation-engine-v1";
import type { HelpContentAudience } from "@/lib/help/types";
import { PHASE_C3_SETTINGS_IA_V1 } from "@/lib/settings/phase-c3-settings-information-architecture-v1";

const LAST_UPDATED = PHASE_C3_SETTINGS_IA_V1.helpLastUpdated;

export type HelpCategoryHubSlug =
  | "buyer"
  | "seller"
  | "payments"
  | "shipping"
  | "orders"
  | "account"
  | "safety"
  | "reports";

export type HelpCategoryHub = {
  slug: HelpCategoryHubSlug;
  title: string;
  summary: string;
  keywords: string[];
  content: string;
  relatedHelp: DocLink[];
  relatedLegal: DocLink[];
  relatedFeatures: DocLink[];
  audience?: HelpContentAudience;
};

export const HELP_CATEGORY_HUB_SLUGS: HelpCategoryHubSlug[] = [
  "buyer",
  "seller",
  "payments",
  "shipping",
  "orders",
  "account",
  "safety",
  "reports",
];

function hub(
  slug: HelpCategoryHubSlug,
  title: string,
  summary: string,
  keywords: string[],
  relatedHelp: DocLink[],
  relatedLegal: DocLink[],
  relatedFeatures: DocLink[],
  body: Omit<
    Parameters<typeof wrapMasterHelpDocument>[0],
    "title" | "lastUpdated" | "relatedHelp" | "relatedLegal" | "relatedFeatures" | "faqs"
  > & { faqs: FaqEntry[] },
): HelpCategoryHub {
  return {
    slug,
    title,
    summary,
    keywords,
    relatedHelp,
    relatedLegal,
    relatedFeatures,
    content: wrapMasterHelpDocument({
      title,
      lastUpdated: LAST_UPDATED,
      relatedHelp,
      relatedLegal,
      relatedFeatures,
      ...body,
    }),
  };
}

const HUBS: Record<HelpCategoryHubSlug, HelpCategoryHub> = {
  buyer: hub(
    "buyer",
    "Buying on ROVEXO",
    "Complete buyer handbook: offers, Buy Now, Checkout, Platform Fee, protection, delivery, refunds, disputes, tracking, wallet and notifications.",
    ["buy", "buyer", "checkout", "offer", "platform fee", "buyer protection", "refund", "return", "dispute", "tracking", "wallet", "notifications"],
    [
      { title: "Orders", href: "/help/category/orders" },
      { title: "Payments & Wallet", href: "/help/category/payments" },
      { title: "Shipping", href: "/help/category/shipping" },
      { title: "Safety", href: "/help/category/safety" },
      { title: "Reports & Appeals", href: "/help/category/reports" },
    ],
    [
      { title: "Buyer Terms", href: "/legal/buyer-terms" },
      { title: "Platform Fee Policy", href: "/legal/platform-fee-policy" },
      { title: "Returns & Refund Policy", href: "/legal/returns-refund-policy" },
      { title: "Shipping Policy", href: "/legal/shipping-policy" },
      { title: "Complaint & Dispute Resolution", href: "/legal/complaint-dispute-resolution" },
      { title: "Terms & Conditions", href: "/legal/terms-and-conditions" },
    ],
    [
      { title: "Search", href: "/search" },
      { title: "Orders", href: "/orders" },
      { title: "Inbox", href: "/inbox" },
      { title: "Saved", href: "/saved" },
      { title: "Balance", href: "/balance" },
      { title: "Settings", href: "/account/settings" },
    ],
    {
      introduction:
        "This handbook explains how buying works on ROVEXO from first browse to delivery, refunds and disputes. ROVEXO is a UK marketplace where every account can buy and sell. Payments use Stripe. Order progress stays in Orders and the Conversation Hub whenever possible.",
      purpose:
        "Give first-time buyers a complete, accurate map of offers, Buy Now, Checkout, Platform Fee, Buyer Protection, shipping, tracking, refunds, returns, disputes, wallet activity and notifications — matching the live product.",
      whoApplies:
        "Anyone with a ROVEXO account who wants to buy. Guests must sign in before Checkout. Sellers buying as customers follow the same buyer rules.",
      definitions: `- **Buy Now** — purchase at the listed price through Checkout Guard checks.
- **Make Offer / Counter Offer** — negotiate inside the Conversation Hub; accepted offers can proceed to payment.
- **Platform Fee** — paid by the **buyer** and included in the Checkout total. Seller Fee is £0.
- **Total Buyer Pays** — item + shipping (if applicable) + Platform Fee as shown before you pay.
- **Conversation Hub** — one page for messages, offers, status and sticky payment/tracking actions for an order context.
- **Buyer Protection** — marketplace protections described in Legal and this handbook; never pay outside ROVEXO.`,
      detailed: `ROVEXO buying is designed so you always know **what** you are buying, **how much** you pay, **where** it ships, and **whether** payment succeeded.

**Offers.** Open a listing → Make Offer → negotiate in Inbox / Conversation Hub. Accept, counter, or decline while the offer is pending. Do not agree prices in external apps for ROVEXO finds.

**Buy Now.** Runs Checkout Guard checks (listing, buyer, seller, price, fee, shipping, locks, audit, idempotency). If any check fails, Checkout does not open — you see a clear ROVEXO error code path, not a silent redirect.

**Checkout.** Review product, address, delivery, contact, payment method and price summary (including Platform Fee). Confirm & Pay once. One click should create one payment, one order and one transaction.

**Platform Fee.** The Platform Fee is paid by the buyer. It is part of the total shown at Checkout and on buyer-facing summaries. Sellers do not take a seller commission from you.

**After payment.** You receive order confirmation, notifications, and Conversation Hub updates. Tracking appears when the seller ships. Keep communication on ROVEXO.

**Issues.** Use Conversation Hub actions and Reports flows. Refunds and disputes follow order status and Legal policies.`,
      steps: `1. Create or sign in to your ROVEXO account.
2. Search or browse → open a listing.
3. Save items you like in Saved (Favourites).
4. Make an Offer or tap Buy Now.
5. Complete Checkout with a delivery address and payment method.
6. Confirm the total (including Platform Fee) and pay once.
7. Watch Orders + Inbox/Conversation Hub + Notifications.
8. Confirm delivery / raise an issue inside ROVEXO if something is wrong.
9. Leave a review only when the order rules allow it.`,
      examples: `- You Buy Now a £40 item. Checkout shows item, shipping and Platform Fee in one total. You pay once. The seller receives the item price under wallet rules; you paid the buyer total.
- You offer £35. The seller counters £38. You accept. Pay through ROVEXO — not bank transfer in chat.
- A parcel is delayed. You open the Conversation Hub / Orders tracking instead of paying again.`,
      mistakes: `- Paying outside ROVEXO (loses protection).
- Ignoring Platform Fee in the total and thinking the seller “added a surprise fee” — Platform Fee is buyer-paid by design.
- Refreshing or double-tapping Pay to “make sure” — can look like a duplicate attempt; wait for confirmation.
- Using a wrong address and only noticing after label creation.`,
      faqs: [
        { question: "Who pays the Platform Fee?", answer: "The buyer. It is included in the Checkout total. Seller Fee is £0." },
        { question: "Where do I track my order?", answer: "Orders and the related Inbox Conversation Hub. Tracking updates appear when shipping starts." },
        { question: "How do refunds work?", answer: "Refunds follow order status, dispute outcomes and payment rules. Keep evidence inside ROVEXO." },
        { question: "Are notifications important?", answer: "Yes. Enable them under Settings → Notifications for offers, payment, shipping and disputes." },
        { question: "Can I buy without an account?", answer: "You need a signed-in ROVEXO account to complete Checkout." },
        { question: "What is Total Buyer Pays?", answer: "The full amount you pay at Checkout, including Platform Fee and applicable shipping — not the item price alone." },
      ],
    },
  ),

  seller: hub(
    "seller",
    "Selling on ROVEXO",
    "Complete seller handbook: listings, Seller Fee £0, buyer-paid Platform Fee, orders, shipping labels, cancellations, disputes, wallet and payouts.",
    ["sell", "seller", "listing", "seller fee", "platform fee", "payout", "wallet", "label", "holiday mode"],
    [
      { title: "Payments & Wallet", href: "/help/category/payments" },
      { title: "Orders", href: "/help/category/orders" },
      { title: "Shipping", href: "/help/category/shipping" },
      { title: "Safety", href: "/help/category/safety" },
      { title: "Buying on ROVEXO", href: "/help/category/buyer" },
    ],
    [
      { title: "Seller Terms", href: "/legal/seller-terms" },
      { title: "Platform Fee Policy", href: "/legal/platform-fee-policy" },
      { title: "Prohibited & Restricted Items Policy", href: "/legal/prohibited-restricted-items" },
      { title: "Wallet Terms", href: "/legal/wallet-terms" },
      { title: "Shipping Policy", href: "/legal/shipping-policy" },
      { title: "Digital Platform Reporting & Tax Notice", href: "/legal/digital-platform-reporting-tax-notice" },
    ],
    [
      { title: "Sell", href: "/sell" },
      { title: "Orders", href: "/orders" },
      { title: "Balance", href: "/balance" },
      { title: "Inbox", href: "/inbox" },
      { title: "Holiday Mode", href: "/account" },
      { title: "Settings", href: "/account/settings" },
    ],
    {
      introduction:
        "Selling on ROVEXO uses the same account you use for buying. Buying and selling share one account — nothing to convert. **Seller Fee = £0**. The **Platform Fee is paid by the buyer** at Checkout.",
      purpose:
        "Explain listing, fees, order lifecycle, shipping, cancellations, disputes, wallet behaviour, and when money becomes available to withdraw — matching live ROVEXO behaviour.",
      whoApplies:
        "Any ROVEXO account that publishes a listing via /sell and fulfils orders under Seller Terms and the Prohibited & Restricted Items Policy.",
      definitions: `- **Seller Fee = £0** — ROVEXO does not take a seller commission from your item price.
- **Platform Fee** — paid by the buyer; do not invent a separate seller percentage for buyers.
- **Balance / Wallet** — where sale proceeds appear and where you withdraw to your bank.
- **Holiday Mode** — hides active listings temporarily without deleting them.
- **Conversation Hub** — where you message the buyer, see status, and take fulfilment actions.`,
      detailed: `**List.** Open Sell → photos → title → category → details → parcel → price → publish. Core fields must pass validation. Optional attributes should not block publish when the core gate passes.

**Fees.** Seller Fee = £0. Buyers pay Platform Fee in their total. Never ask buyers to pay outside ROVEXO to “avoid fees”.

**Orders.** When a buyer pays, fulfil from Orders / Conversation Hub. Print/create shipping labels through ROVEXO shipping flows. Update tracking. Do not invent parallel fulfilment channels that bypass the order.

**Money.** Proceeds follow escrow/protection timing. Available Balance is what you can withdraw. Pending funds are not withdrawable yet.

**Cancellations & disputes.** Follow in-product actions and Legal policies. Keep evidence in chat.

**Compliance.** Every listing must obey the Prohibited & Restricted Items compliance manual.`,
      steps: `1. Sign in → Sell.
2. Add clear photos and an honest title/description.
3. Choose the correct category (Catalog Master roots).
4. Set price and parcel size.
5. Publish once and wait for success.
6. Respond to offers in Inbox.
7. After payment — ship promptly with the label/tracking flow.
8. Monitor Orders and Conversation Hub until completion.
9. Withdraw Available Balance from Balance/Wallet when ready.`,
      examples: `- You list for £50. Buyer pays total including Platform Fee. You still have Seller Fee £0 — no seller commission line is deducted as a “Seller Fee”.
- You go on holiday → Holiday Mode hides listings → turn off when back.
- A listing is removed for a prohibited item → read the compliance manual and appeal only if misclassified.`,
      mistakes: `- Adding your own “platform fee” onto the item price and blaming ROVEXO.
- Asking for bank transfer in chat.
- Listing prohibited weapons, medicines, or whole vehicles.
- Shipping without tracking when the flow provides it.`,
      faqs: [
        { question: "What is the Seller Fee?", answer: "£0. There is no seller commission on ROVEXO sales." },
        { question: "Who pays the Platform Fee?", answer: "The buyer. It appears in the buyer’s total." },
        { question: "When is money released?", answer: "After payment, funds follow escrow/protection timing tied to delivery and confirmation. Available Balance is withdrawable." },
        { question: "Where do I manage payouts?", answer: "Balance (Wallet): transactions, payment methods, bank accounts and withdraw." },
        { question: "Can I edit or pause a listing?", answer: "Yes — manage listings from your selling surfaces; use Holiday Mode to pause visibility." },
        { question: "Do I need a different account to sell?", answer: "No. One ROVEXO account buys and sells." },
      ],
    },
  ),

  payments: hub(
    "payments",
    "Payments & Wallet",
    "Checkout payments, Stripe, Platform Fee, Balance, withdrawals, statements and payment safety.",
    ["payment", "wallet", "balance", "withdraw", "stripe", "platform fee", "refund", "card"],
    [
      { title: "Buying on ROVEXO", href: "/help/category/buyer" },
      { title: "Selling on ROVEXO", href: "/help/category/seller" },
      { title: "Orders", href: "/help/category/orders" },
    ],
    [
      { title: "Payment Terms", href: "/legal/payment-terms" },
      { title: "Wallet Terms", href: "/legal/wallet-terms" },
      { title: "Platform Fee Policy", href: "/legal/platform-fee-policy" },
      { title: "Returns & Refund Policy", href: "/legal/returns-refund-policy" },
    ],
    [
      { title: "Checkout", href: "/checkout" },
      { title: "Balance", href: "/balance" },
      { title: "Payment Methods", href: "/wallet/payment-methods" },
      { title: "Bank Accounts", href: "/wallet/bank-accounts" },
      { title: "Transactions", href: "/wallet/transactions" },
    ],
    {
      introduction:
        "Payments on ROVEXO are processed through Stripe. Seller proceeds sit in Wallet/Balance. Platform Fee is buyer-paid. Seller Fee is £0.",
      purpose:
        "Explain how money moves: buyer payment → order/transaction → escrow/protection timing → seller Available Balance → withdraw.",
      whoApplies: "Buyers paying at Checkout and sellers receiving or withdrawing proceeds.",
      definitions: `- **Checkout** — buyer payment capture.
- **Wallet / Balance** — seller financial home (also reachable as Balance from Profile).
- **Available / Pending** — withdrawable vs held funds.
- **Platform Fee** — buyer-paid.
- **Seller Fee** — £0.`,
      detailed: `Pay only through ROVEXO Checkout. Card and supported Stripe methods appear in Checkout. After success, the order and Conversation Hub update.

Sellers open Balance for transactions, statements, bank accounts and withdraw. Withdrawals go to the linked bank account and may be delayed for verification or fraud review.

Refunds reverse eligible payments under Returns & Refund and dispute policies. Full Demo accounts use virtual money and must never trigger real payouts.`,
      steps: `1. Buyer: choose payment method in Checkout → Confirm & Pay once.
2. Wait for success confirmation — do not re-pay.
3. Seller: open Balance to see the transaction.
4. Add bank details under Wallet bank settings before withdrawing.
5. Withdraw Available Balance only.
6. Download statements for records.`,
      examples: `- Payment declined → fix card/details → try once more; contact Support if it keeps failing.
- Pending Balance after a sale → wait for protection/delivery timing before withdraw.`,
      mistakes: `- Off-platform payment.
- Withdrawing before funds are Available.
- Confusing Platform Fee (buyer) with a Seller Fee (there is none).`,
      faqs: [
        { question: "Is Platform Fee charged to sellers?", answer: "No. Platform Fee is paid by the buyer. Seller Fee is £0." },
        { question: "Where is my Balance?", answer: "Open Balance from Profile (/balance) — Wallet surfaces." },
        { question: "Why is withdraw delayed?", answer: "Verification, fraud review, or pending order protection timing." },
        { question: "Are demo accounts different?", answer: "Full Demo uses virtual money and must never call real Stripe payouts." },
      ],
    },
  ),

  shipping: hub(
    "shipping",
    "Shipping & Delivery",
    "Parcels, labels, tracking, addresses, delivery issues and carrier limits.",
    ["shipping", "delivery", "tracking", "label", "parcel", "postage", "address"],
    [
      { title: "Orders", href: "/help/category/orders" },
      { title: "Selling on ROVEXO", href: "/help/category/seller" },
      { title: "Buying on ROVEXO", href: "/help/category/buyer" },
    ],
    [
      { title: "Shipping Policy", href: "/legal/shipping-policy" },
      { title: "Delivery Policy", href: "/legal/delivery-policy" },
      { title: "Prohibited & Restricted Items Policy", href: "/legal/prohibited-restricted-items" },
    ],
    [
      { title: "Orders", href: "/orders" },
      { title: "Inbox", href: "/inbox" },
      { title: "Addresses", href: "/account/addresses" },
    ],
    {
      introduction:
        "Shipping connects a paid order to a tracked delivery. Sellers fulfil; buyers provide accurate addresses. Dangerous and prohibited goods cannot be shipped.",
      purpose: "Explain labels, tracking, address changes, delivery problems and how shipping ties to the Conversation Hub.",
      whoApplies: "Sellers fulfilling orders and buyers receiving parcels.",
      definitions: `- **Label** — shipping label created in the ROVEXO fulfilment flow.
- **Tracking** — carrier events shown in Orders / Hub.
- **Parcel size** — set at listing and used for shipping options.`,
      detailed: `After payment, the seller creates/prints the label and hands the parcel to the carrier. Tracking appears for both parties in Orders and Conversation Hub.

Buyers should keep addresses accurate in account address settings before paying. Changes after label creation may be impossible.

Restricted/prohibited items may be unsellable or unshippable — see the compliance manual.`,
      steps: `1. Buyer confirms address at Checkout.
2. Seller packs safely and creates the label in-product.
3. Seller ships and keeps proof.
4. Both parties watch tracking.
5. Buyer reports delivery issues inside ROVEXO promptly.`,
      examples: `- Wrong address noticed before label → update if still allowed; otherwise Contact Support/seller via Inbox immediately.
- Tracking stuck → wait carrier scan windows, then open an issue in Hub.`,
      mistakes: `- Shipping prohibited items.
- Using a different carrier without updating tracking.
- Ignoring lithium battery carrier rules.`,
      faqs: [
        { question: "Who arranges shipping?", answer: "The seller fulfils using ROVEXO’s shipping/label flow for the order." },
        { question: "Can I change address after payment?", answer: "Only if the order status still allows it — contact Support/seller immediately via Inbox." },
        { question: "Where do I see tracking?", answer: "Orders and Conversation Hub." },
      ],
    },
  ),

  orders: hub(
    "orders",
    "Orders",
    "Order lifecycle from payment to completion — buyer and seller views, cancellations, disputes and reviews.",
    ["orders", "status", "cancel", "dispute", "review", "completed"],
    [
      { title: "Buying on ROVEXO", href: "/help/category/buyer" },
      { title: "Selling on ROVEXO", href: "/help/category/seller" },
      { title: "Shipping", href: "/help/category/shipping" },
      { title: "Reports & Appeals", href: "/help/category/reports" },
    ],
    [
      { title: "Buyer Terms", href: "/legal/buyer-terms" },
      { title: "Seller Terms", href: "/legal/seller-terms" },
      { title: "Returns & Refund Policy", href: "/legal/returns-refund-policy" },
      { title: "Complaint & Dispute Resolution", href: "/legal/complaint-dispute-resolution" },
    ],
    [
      { title: "Orders", href: "/orders" },
      { title: "Inbox", href: "/inbox" },
    ],
    {
      introduction:
        "Orders is the list of your purchases and sales. Each order ties to one Conversation Hub experience for messages, status and actions.",
      purpose: "Explain statuses, what buyers vs sellers see, cancellations, disputes, completion and reviews.",
      whoApplies: "Every user with purchases or sales.",
      definitions: `- **Bought / Sold** — buyer vs seller sides.
- **In Progress / Completed / Cancelled** — lifecycle buckets.
- **Conversation Hub** — single scroll experience for the order context.`,
      detailed: `Buyers see what they paid (including Platform Fee in buyer totals). Sellers see their proceeds context and must never be shown buyer Platform Fee breakdowns in seller-only surfaces.

Sticky actions change with lifecycle (pay, track, confirm, issue, review) inside the Hub. Checkout is the normal payment redirect; then you return to the Hub.

Reviews are for completed eligible orders within the review window. Returned orders do not boost reputation.

Cancellations are only available while the status allows them. Disputes use Complaint & Dispute Resolution plus in-product issue flows. Always keep evidence in the Conversation Hub so Support can audit the same thread the parties used.`,
      steps: `1. Open Orders.
2. Select Bought or Sold.
3. Open an order → Conversation Hub.
4. Follow the sticky CTA for the current status.
5. Complete, cancel, or escalate per on-screen rules.
6. When eligible, leave a review once — then the order can move to Completed.`,
      examples: `- Buyer: paid → wait for ship → track → confirm/issue → review.
- Seller: paid → label → ship → wait confirmation → withdraw when Available.
- Buyer opens an issue after delivery damage → Hub issue flow → Support/dispute path without leaving the order context.`,
      mistakes: `- Leaving the Hub for parallel “journey pages” that do not exist.
- Expecting seller screens to show buyer fee lines.`,
      faqs: [
        { question: "Where is my order chat?", answer: "Inbox → Conversation for that order." },
        { question: "Can I cancel?", answer: "Only while status allows — use in-product cancel/issue actions." },
        { question: "When can I review?", answer: "After eligible completion within the review window." },
      ],
    },
  ),

  account: hub(
    "account",
    "Your ROVEXO Account",
    "ROVEXO account, Settings, privacy, security, addresses, notifications and Holiday Mode.",
    ["account", "settings", "profile", "password", "privacy", "notifications", "addresses", "holiday mode"],
    [
      { title: "Safety", href: "/help/category/safety" },
      { title: "Payments & Wallet", href: "/help/category/payments" },
      { title: "Reports & Appeals", href: "/help/category/reports" },
    ],
    [
      { title: "Privacy Policy", href: "/legal/privacy-policy" },
      { title: "Cookie Policy", href: "/legal/cookie-policy" },
      { title: "Terms & Conditions", href: "/legal/terms-and-conditions" },
      { title: "Verification Policy", href: "/legal/verification-policy" },
      { title: "Account Suspension Policy", href: "/legal/account-suspension-policy" },
    ],
    [
      { title: "My Account", href: "/account" },
      { title: "Settings", href: "/account/settings" },
      { title: "Privacy", href: "/account/privacy" },
      { title: "Security", href: "/account/security" },
      { title: "Addresses", href: "/account/addresses" },
      { title: "Legal Information", href: "/legal" },
    ],
    {
      introduction:
        "ROVEXO uses one account. Email identifies the account. The same account can buy and sell. Business tools are a switch and verified information on that account. Settings is the control centre.",
      purpose: "Explain profile, settings areas, notifications, addresses, Holiday Mode, and how Legal/Help connect from account surfaces.",
      whoApplies: "Every signed-in user.",
      definitions: `- **ROVEXO account** — one account that can buy and sell. Business is verified information on the same account.
- **Settings** — security, privacy, notifications, preferences.
- **Holiday Mode** — temporarily hide listings.`,
      detailed: `From Profile you reach Favourites/Saved, Balance, Orders, Holiday Mode, Settings, Rovexo Ideas, Help Centre, Legal Information and Sign Out.

Settings covers security and privacy controls that remain in product. Currency & Region is UK-focused. Delete Account lives in Settings.

Legal Information is an index of canonical policies — each policy has one version under /legal/{slug}.`,
      steps: `1. Open Profile (/account).
2. Update profile details and avatar.
3. Open Settings for security/privacy/notifications.
4. Add addresses before Checkout.
5. Use Holiday Mode when away from selling.
6. Sign out from Profile when needed.`,
      examples: `- Going on holiday → Holiday Mode on → listings hidden → Mode off when back.
- New phone → review Security sessions.`,
      mistakes: `- Creating duplicate accounts to bypass limits.
- Ignoring notification settings then missing shipping deadlines.`,
      faqs: [
        { question: "Is selling a different account?", answer: "No. One ROVEXO account." },
        { question: "Where is Legal?", answer: "/legal — index only; open each policy for the canonical text." },
        { question: "Where is Help?", answer: "/help — category handbooks and search." },
      ],
    },
  ),

  safety: hub(
    "safety",
    "Safety & Trust",
    "Stay safe buying and selling: prohibited items, scams, reports, AI moderation and buyer/seller protection links.",
    ["safety", "scam", "fraud", "prohibited", "trust", "moderation", "protection"],
    [
      { title: "Reports & Appeals", href: "/help/category/reports" },
      { title: "Buying on ROVEXO", href: "/help/category/buyer" },
      { title: "Selling on ROVEXO", href: "/help/category/seller" },
    ],
    [
      { title: "Prohibited & Restricted Items Policy", href: "/legal/prohibited-restricted-items" },
      { title: "Acceptable Use Policy", href: "/legal/acceptable-use-policy" },
      { title: "Community Guidelines", href: "/legal/community-guidelines" },
      { title: "Account Suspension Policy", href: "/legal/account-suspension-policy" },
    ],
    [
      { title: "Help Centre", href: "/help" },
      { title: "Contact Support", href: "/support" },
      { title: "Inbox", href: "/inbox" },
    ],
    {
      introduction:
        "Safety on ROVEXO means staying on-platform, obeying the Prohibited & Restricted Items compliance manual, and reporting problems early.",
      purpose: "Teach scam patterns, prohibited goods, moderation/AI detection, and how protection links to Legal.",
      whoApplies: "All users.",
      definitions: `- **Allowed / Restricted / Prohibited** — the only three product states.
- **Off-platform payment** — prohibited fee circumvention / protection loss.
- **Report** — in-product report tools + Contact Support.`,
      detailed: `Never pay outside ROVEXO for ROVEXO finds. Never list Prohibited items. Restricted items need disclosures and may be reviewed.

AI moderation analyses titles, descriptions, images, brands, duplicates and keywords, then risk-scores for allow/review/block. Appeals go through Reports & Appeals / Support.

Read the full compliance manual for individual product rules (weapons, medicines, cosmetics, electronics, vehicle parts, and more).`,
      steps: `1. Read Prohibited & Restricted Items Policy before selling unusual goods.
2. Keep checkout and chat on ROVEXO.
3. Report suspicious listings or messages.
4. Appeal only with evidence if you believe a mistake occurred.`,
      examples: `- Buyer asks for bank transfer → refuse and report.
- Listing removed for weapon keyword → check compliance manual; do not relist.`,
      mistakes: `- “Friends and family” payment requests.
- Relisting prohibited goods with renamed titles.`,
      faqs: [
        { question: "Where is the full prohibited list?", answer: "Legal → Prohibited & Restricted Items Policy — the compliance manual." },
        { question: "What are the three product states?", answer: "Allowed, Restricted, Prohibited." },
        { question: "Can I pay outside ROVEXO?", answer: "No — you lose protection and it breaches policy." },
      ],
    },
  ),

  reports: hub(
    "reports",
    "Reports & Appeals",
    "How to report listings, users and messages — and how to appeal moderation decisions.",
    ["report", "appeal", "moderation", "support", "complaint"],
    [
      { title: "Safety", href: "/help/category/safety" },
      { title: "Account", href: "/help/category/account" },
      { title: "Orders", href: "/help/category/orders" },
    ],
    [
      { title: "Complaint & Dispute Resolution", href: "/legal/complaint-dispute-resolution" },
      { title: "Account Suspension Policy", href: "/legal/account-suspension-policy" },
      { title: "Intellectual Property & Notice and Takedown Policy", href: "/legal/intellectual-property-policy" },
      { title: "Community Guidelines", href: "/legal/community-guidelines" },
    ],
    [
      { title: "Contact Support", href: "/support" },
      { title: "Inbox", href: "/inbox" },
      { title: "Help Centre", href: "/help" },
    ],
    {
      introduction:
        "Reports flag harm. Appeals ask ROVEXO to reconsider a moderation outcome. Both need clear evidence — not duplicates.",
      purpose: "Explain how to report, what happens next, how appeals work, and how IP notices differ from general reports.",
      whoApplies: "Any user who sees a policy breach or receives a moderation notice.",
      definitions: `- **Report** — flag a listing, user, or conversation.
- **Appeal** — request review of a removal/suspension decision.
- **Notice and Takedown** — IP rights holder process in Legal.`,
      detailed: `Use Report Listing / Report conversation tools where available, or Contact Support with URLs and screenshots.

Duplicate reports do not speed review. Threats or abuse in appeals can worsen outcomes.

IP owners should follow the Intellectual Property Notice and Takedown policy with required fields.

Order disputes (item not received, not as described) usually start from the Conversation Hub issue actions and may escalate through Complaint & Dispute Resolution. Safety reports (scams, weapons, fake IDs) should be filed immediately even if you are not a party to the order.`,
      steps: `1. Collect the listing/conversation URL and screenshots.
2. Submit Report or Support request with facts only.
3. Wait for the review outcome notification.
4. If appealing, explain why the decision is wrong and attach evidence once.
5. Do not relist the same Prohibited item while an appeal is open.`,
      examples: `- Counterfeit bag listing → Report Listing + brand evidence.
- Listing removed in error → Appeal with proof of Allowed classification.
- Buyer asks for off-platform payment → report the conversation and do not pay.`,
      mistakes: `- Spamming five tickets for the same issue.
- Appealing clear Prohibited weapons with “collector” excuses.`,
      faqs: [
        { question: "How do I appeal?", answer: "Contact Support → appeal topic → listing URL + evidence." },
        { question: "Do multiple reports help?", answer: "No. One clear report is enough." },
        { question: "How do IP takedowns work?", answer: "Follow Legal → Intellectual Property & Notice and Takedown Policy." },
      ],
    },
  ),
};

export function isHelpCategoryHubSlug(slug: string): slug is HelpCategoryHubSlug {
  return (HELP_CATEGORY_HUB_SLUGS as string[]).includes(slug);
}

export function getHelpCategoryHub(slug: string): HelpCategoryHub | null {
  if (!isHelpCategoryHubSlug(slug)) return null;
  return HUBS[slug];
}

export function listHelpCategoryHubs(): HelpCategoryHub[] {
  return HELP_CATEGORY_HUB_SLUGS.map((slug) => HUBS[slug]);
}

export function listHelpCategoryHubsForAudience(
  allowedAudiences: readonly HelpContentAudience[],
): HelpCategoryHub[] {
  return listHelpCategoryHubs().filter((hub) =>
    allowedAudiences.includes(hub.audience ?? "shared"),
  );
}
