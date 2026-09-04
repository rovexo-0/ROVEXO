import type { HelpArticle, HelpCategory } from "@/lib/help/types";
import { enrichHelpArticle } from "@/lib/help/content/article-meta";
import { WAVE_A_HELP_ARTICLES } from "@/lib/help/content/wave-a-articles-v1";
import {
  canAccessHelpContent,
  HELP_AUDIENCES_FOR_GUEST,
  type HelpContentAudience,
} from "@/lib/help/help-content-audience-v1";
import {
  PRIVACY_DATA_CONTROLLER_MARKDOWN,
  TERMS_PLATFORM_OPERATOR_MARKDOWN,
} from "@/lib/legal/content";

export const HELP_CATEGORIES: Array<{ id: HelpCategory; label: string; description: string }> = [
  { id: "account", label: "Account", description: "Sign in, security, and profile settings" },
  { id: "buying", label: "Buying", description: "Browse, purchase, and purchase protection" },
  { id: "selling", label: "Selling", description: "List items and manage inventory" },
  { id: "payments", label: "Payments", description: "Checkout, payouts, and refunds" },
  { id: "delivery", label: "Delivery", description: "Shipping, tracking, and delivery options" },
  { id: "chat", label: "Chat", description: "Messaging buyers and sellers safely" },
  { id: "pro-seller", label: "Pro Seller", description: "Analytics, promotions, and growth tools" },
  { id: "business-accounts", label: "Seller tax status", description: "Tax registration on your ROVEXO account" },
  { id: "safety", label: "Safety", description: "Stay safe on ROVEXO" },
  { id: "ai-moderation", label: "AI Moderation", description: "How automated review works" },
  { id: "prohibited-items", label: "Prohibited Items", description: "Items not allowed on ROVEXO" },
  { id: "community-guidelines", label: "Community Guidelines", description: "Expected behaviour on the platform" },
  { id: "reports-appeals", label: "Reports & Appeals", description: "Report content and request review" },
  { id: "privacy", label: "Privacy", description: "How we handle your data" },
  { id: "terms", label: "Terms", description: "Terms of service" },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "account-overview",
    title: "Managing your ROVEXO account",
    category: "account",
    summary: "Update your profile, email, and notification preferences.",
    keywords: ["account", "profile", "settings", "email", "password"],
    content: `# Managing your ROVEXO account

Your account settings control how you appear on ROVEXO and how we contact you.

## Profile settings
- Open **Settings** from your profile menu to update your name, avatar, and preferences.
- Keep your email address verified so you can recover access and receive order updates.

## Security
- Use a strong, unique password.
- Sign out of shared devices after use.
- Contact Support immediately if you notice suspicious activity.`,
  },
  {
    slug: "reset-password",
    title: "Reset your password",
    category: "account",
    summary: "Recover access if you forget your password.",
    keywords: ["password", "reset", "forgot", "login"],
    content: `# Reset your password

1. Go to the **Forgot password** page from the sign-in screen.
2. Enter the email linked to your ROVEXO account.
3. Follow the secure link in the email to choose a new password.

If you do not receive the email within a few minutes, check spam folders or contact Support.`,
  },
  {
    slug: "buying-how-to-buy",
    title: "How to buy on ROVEXO",
    category: "buying",
    summary: "Search, checkout, and receive your order.",
    keywords: ["buy", "purchase", "checkout", "order"],
    content: `# How to buy on ROVEXO

## Find an item
- Browse categories or search by keyword, brand, or condition.
- Open a listing to review photos, description, seller rating, and delivery options.

## Checkout
- Tap **Buy now** on the listing page.
- Choose delivery and complete payment securely through ROVEXO checkout.
- Keep all communication on ROVEXO Messages for purchase protection.

## After purchase
- Track your order from **Orders** in your profile.
- Confirm delivery when your item arrives as described.`,
  },
  {
    slug: "buying-buyer-protection",
    title: "Purchase protection on ROVEXO",
    category: "buying",
    summary: "How ROVEXO protects your purchase.",
    keywords: ["protection", "refund", "dispute", "safe"],
    content: `# Purchase protection

ROVEXO checkout includes purchase protection on eligible purchases.

## Covered issues
- Item not received
- Item significantly not as described
- Counterfeit items where prohibited

## How to get help
- Message the seller in Conversation Hub.
- Use the in-product issue flow on the order when it is available.
- If unresolved, contact Support. Keep evidence on ROVEXO.`
  },
  {
    slug: "selling-get-started",
    title: "Start selling on ROVEXO",
    category: "selling",
    summary: "Create your first listing and reach buyers.",
    keywords: ["sell", "listing", "publish", "photos"],
    content: `# Start selling on ROVEXO

## Create a listing
1. Tap **Sell** and add clear photos in good lighting.
2. Write an honest title and detailed description.
3. Set a fair price and choose the correct category.
4. Publish when ready.

## Seller requirements
- Complete seller tax registration before receiving payouts.
- Add your bank account for secure payouts.
- Follow prohibited items and community guidelines.`,
  },
  {
    slug: "selling-photos",
    title: "Listing photo guidelines",
    category: "selling",
    summary: "Take photos that help buyers trust your listing.",
    keywords: ["photos", "images", "listing", "quality"],
    content: `# Listing photo guidelines

- Use natural light and show the item from multiple angles.
- Include close-ups of labels, defects, or wear.
- Do not use stock photos for used items.
- Avoid watermarks or misleading edits.

Listings with clear photos sell faster and receive fewer disputes.`,
  },
  {
    slug: "payments-checkout",
    title: "Payments and checkout",
    category: "payments",
    summary: "How payment works for buyers and sellers.",
    keywords: ["payment", "checkout", "card", "stripe"],
    content: `# Payments and checkout

## Buyers
- Pay in ROVEXO Checkout with a supported payment method.
- Review **Total Buyer Pays** before Confirm & Pay.

## Sellers
- Seller Fee is £0. Buyers pay Platform Fee as part of Total Buyer Pays.
- After protection timing, funds appear in Balance for withdrawal to a verified bank account.
- Add your bank account from Balance to withdraw.`
  },
  {
    slug: "payments-refunds",
    title: "Refunds and cancellations",
    category: "payments",
    summary: "When refunds apply and how they are processed.",
    keywords: ["refund", "cancel", "return"],
    content: `# Refunds and cancellations

## Before shipment
- Sellers may cancel if an item is unavailable; buyers receive a full refund.

## After delivery
- Refunds depend on the issue and purchase protection eligibility.
- Submit a support request with photos and your order number.

Refunds return to the original payment method when approved.`,
  },
  {
    slug: "delivery-shipping",
    title: "Delivery and shipping",
    category: "delivery",
    summary: "Delivery options and seller responsibilities.",
    keywords: ["delivery", "shipping", "post", "courier"],
    content: `# Delivery and shipping

## At checkout
- Available delivery options and fees are shown before you pay.
- Checkout uses ROVEXO shipping quotes for that order.

## Seller responsibilities
- Fulfil using the ROVEXO label flow for the paid order.
- Pack to the declared parcel size.
- Mark shipped so tracking can appear in Orders and Conversation Hub.`
  },
  {
    slug: "delivery-tracking",
    title: "Track your order",
    category: "delivery",
    summary: "Follow shipment progress from order to delivery.",
    keywords: ["tracking", "shipped", "delivered"],
    content: `# Track your order

Open **Orders** and select your purchase to view status updates.

## Status stages
- **Awaiting shipment** — payment received, seller preparing the item
- **Shipped** — tracking appears when the seller ships
- **Delivered** — carrier or order status shows delivered
- **Completed** — the order is completed in Orders / Conversation Hub

Contact the seller in Conversation Hub if tracking stalls.`
  },
  {
    slug: "chat-safety",
    title: "Chat safely on ROVEXO",
    category: "chat",
    summary: "Keep conversations and payments on the platform.",
    keywords: ["chat", "messages", "scam", "whatsapp"],
    content: `# Chat safely on ROVEXO

- Keep negotiations and payments on ROVEXO.
- Do not share personal emails, phone numbers, or external payment links in chat.
- Report suspicious messages using **Report conversation**.
- ROVEXO may warn or block messages that attempt off-platform deals.`,
  },
  {
    slug: "pro-seller-dashboard",
    title: "Selling workspace",
    category: "pro-seller",
    summary: "Sell, fulfil orders, and use Balance on the same ROVEXO account.",
    keywords: ["selling", "orders", "balance", "sell"],
    content: `# Selling workspace

Selling uses the same ROVEXO account you use for buying. There is no second account to create.

## What you can use today
- Publish listings from **Sell**
- Manage orders in **Orders** and Conversation Hub
- View **Balance** and withdraw when eligible

Paid promotions (featured listings and bumps) are not a live v1.0 product. Promote on Profile is Coming Soon.`,
  },
  {
    slug: "pro-seller-promotions",
    title: "Featured listings and bumps",
    category: "pro-seller",
    summary: "Paid listing promotions are not a live v1.0 product.",
    keywords: ["featured", "bump", "promotion", "coming soon"],
    content: `# Featured listings and bumps

Paid listing promotions (featured placements and bumps) are **not available** as a live ROVEXO product in v1.0.

Promote on Profile is shown as **Coming Soon**. This article is not a live subscription, advertising, or paid-promotion product.

To reach buyers today, publish a complete listing from **Sell** with accurate photos, category, price, and parcel size.`,
  },
  {
    slug: "business-accounts-setup",
    title: "Seller tax status",
    category: "selling",
    summary: "Complete seller tax registration on your ROVEXO account before payouts.",
    keywords: ["tax", "company", "vat", "sole trader", "payout"],
    content: `# Seller tax status

ROVEXO uses one account. Tax registration status is information used for payouts and reporting — not a separate commercial account product. Business tools are a switch and verified information on the same account.

## Tax registration
- Open Seller Tax Registration and choose the status that matches your situation: **Personal**, **Pro Seller**, **Sole Trader**, or **Company**.
- Provide accurate details and VAT number when applicable.
- Complete bank account setup for Wallet withdrawals.

You remain responsible for your own tax and consumer-law obligations when selling commercially.`,
  },
  {
    slug: "safety-tips",
    title: "Safety tips for buyers and sellers",
    category: "safety",
    summary: "Practical steps to trade safely.",
    keywords: ["safety", "secure", "trust"],
    content: `# Safety tips

- Meet only in safe public places if collecting locally.
- Never pay outside ROVEXO checkout.
- Check seller ratings and listing details carefully.
- Report suspicious behaviour immediately.`,
  },
  {
    slug: "ai-moderation-overview",
    title: "How AI moderation works",
    category: "ai-moderation",
    summary: "Automated review of listings, images, and messages.",
    keywords: ["moderation", "ai", "review", "blocked"],
    content: `# How AI moderation works

ROVEXO uses automated moderation to review:
- Listing titles, descriptions, and images
- Chat messages
- User reports

## Outcomes
- **Approved** — no action needed
- **Warning** — listing or message flagged; may remain visible with notice
- **Blocked** — content removed or paused pending review

You can request manual review if you believe a decision was incorrect.`,
  },
  {
    slug: "ai-moderation-appeals",
    title: "Request a moderation review",
    category: "ai-moderation",
    summary: "Appeal an automated moderation decision.",
    keywords: ["appeal", "review", "moderation", "blocked"],
    content: `# Request a moderation review

If your listing or account action seems incorrect:

1. Review the notice shown on your listing or message.
2. Edit the listing if the issue is clear.
3. Submit **Appeal Moderation** via Contact Support with your listing link and explanation.

Each appeal is reviewed individually. Duplicate appeals do not speed up processing.`,
  },
  {
    slug: "prohibited-items-list",
    title: "Prohibited items on ROVEXO",
    category: "prohibited-items",
    summary: "Items that cannot be listed or sold.",
    keywords: ["prohibited", "banned", "weapons", "drugs"],
    content: `# Prohibited items

The canonical prohibited and restricted items rules live in Legal.

→ [Prohibited & Restricted Items](/legal/prohibited-restricted-items)

This Help entry exists for search only and redirects to the Legal document.`,
  },
  {
    slug: "community-guidelines",
    title: "Community guidelines",
    category: "community-guidelines",
    summary: "Standards for respectful trading on ROVEXO.",
    keywords: ["community", "guidelines", "behaviour", "respect"],
    content: `# Community guidelines

The canonical Community Guidelines live in Legal.

→ [Community Guidelines](/legal/community-guidelines)

This Help entry exists for search only and redirects to the Legal document.`,
  },
  {
    slug: "reports-appeals-process",
    title: "Reports and appeals",
    category: "reports-appeals",
    summary: "Report issues and request review.",
    keywords: ["report", "appeal", "support"],
    content: `# Reports and appeals

## Report a listing
- Open the listing and use **Report listing**.
- Choose the reason and add details.

## Report a user or conversation
- Use **Report conversation** in Messages or Contact Support.

## Appeals
- Select **Appeal Moderation** when contacting Support.
- Include evidence and remain factual.

Submitting multiple reports for the same issue does not speed up processing.`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy policy",
    category: "privacy",
    summary: "How ROVEXO collects and uses personal data.",
    keywords: ["privacy", "data", "gdpr", "cookies"],
    content: `# Privacy policy

The canonical Privacy Policy lives in Legal.

→ [Privacy Policy](/legal/privacy-policy)

This Help entry exists for search only and redirects to the Legal document.

${PRIVACY_DATA_CONTROLLER_MARKDOWN}`,
  },
  {
    slug: "terms-of-service",
    title: "Terms of service",
    category: "terms",
    summary: "Agreement between you and ROVEXO.",
    keywords: ["terms", "service", "legal", "agreement"],
    content: `# Terms of service

The canonical Terms & Conditions live in Legal.

→ [Terms & Conditions](/legal/terms-and-conditions)

Platform Fee is paid by the buyer. Seller Fee is £0. See [Platform Fee Policy](/legal/platform-fee-policy).

This Help entry exists for search only and redirects to the Legal document.

${TERMS_PLATFORM_OPERATOR_MARKDOWN}`,
  },
  {
    slug: "trust-and-safety",
    title: "Trust & safety",
    category: "safety",
    summary: "How ROVEXO protects the marketplace.",
    keywords: ["trust", "safety", "fraud", "protection"],
    content: `# Trust & safety

ROVEXO combines automated moderation, secure payments, and human review to reduce fraud.

## What we monitor
- Prohibited and dangerous items
- Scam patterns in chat
- Off-platform payment attempts
- Repeated policy violations

Report concerns through Contact Support or in-app report tools.`,
  },
  {
    slug: "seller-tax-registration",
    title: "Seller tax registration",
    category: "selling",
    summary: "Complete tax registration on your ROVEXO account before payouts.",
    keywords: ["tax", "vat", "utr", "nino", "stripe connect", "personal"],
    content: `# Seller tax registration

Before receiving payouts, complete seller tax registration on your ROVEXO account:

## Registration status (tax purposes)
- **Personal** — occasional selling
- **Pro Seller** — regular individual selling
- **Sole Trader** — sole trader tax status
- **Company** — registered company tax status

These are tax registration statuses, not separate marketplace roles or products. Provide accurate details including address and tax identifiers where required. Then add your bank account for Wallet withdrawals.`,
  },
  ...WAVE_A_HELP_ARTICLES,
];

export function getHelpArticle(slug: string): HelpArticle | undefined {
  const article = HELP_ARTICLES.find((entry) => entry.slug === slug);
  return article ? enrichHelpArticle(article) : undefined;
}

export function getHelpArticleForAudience(
  slug: string,
  allowedAudiences: readonly HelpContentAudience[] = HELP_AUDIENCES_FOR_GUEST,
): HelpArticle | undefined {
  const article = getHelpArticle(slug);
  if (!article || !canAccessHelpContent(article.audience, allowedAudiences)) {
    return undefined;
  }
  return article;
}

export function getHelpArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => article.category === category).map(enrichHelpArticle);
}

export function getAllHelpArticles(): HelpArticle[] {
  return HELP_ARTICLES.map(enrichHelpArticle);
}

export function listHelpArticlesForAudience(
  allowedAudiences: readonly HelpContentAudience[] = HELP_AUDIENCES_FOR_GUEST,
): HelpArticle[] {
  return getAllHelpArticles().filter((article) => canAccessHelpContent(article.audience, allowedAudiences));
}
