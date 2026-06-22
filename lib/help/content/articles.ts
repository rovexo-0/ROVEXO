import type { HelpArticle, HelpCategory } from "@/lib/help/types";
import { enrichHelpArticle } from "@/lib/help/content/article-meta";

export const HELP_CATEGORIES: Array<{ id: HelpCategory; label: string; description: string }> = [
  { id: "account", label: "Account", description: "Sign in, security, and profile settings" },
  { id: "buying", label: "Buying", description: "Browse, purchase, and buyer protection" },
  { id: "selling", label: "Selling", description: "List items and manage inventory" },
  { id: "payments", label: "Payments", description: "Checkout, payouts, and refunds" },
  { id: "delivery", label: "Delivery", description: "Shipping, tracking, and delivery options" },
  { id: "chat", label: "Chat", description: "Messaging buyers and sellers safely" },
  { id: "pro-seller", label: "Pro Seller", description: "Analytics, promotions, and growth tools" },
  { id: "business-accounts", label: "Business Accounts", description: "Business registration and inventory" },
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
- Keep all communication on ROVEXO Messages for buyer protection.

## After purchase
- Track your order from **Orders** in your profile.
- Confirm delivery when your item arrives as described.`,
  },
  {
    slug: "buying-buyer-protection",
    title: "Buyer protection on ROVEXO",
    category: "buying",
    summary: "How ROVEXO protects your purchase.",
    keywords: ["protection", "refund", "dispute", "safe"],
    content: `# Buyer protection

ROVEXO checkout includes buyer protection on eligible purchases.

## Covered issues
- Item not received
- Item significantly not as described
- Counterfeit items where prohibited

## How to get help
- Message the seller first from your order page.
- If unresolved, open a support request from **Contact Support** with your order number.`,
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
- Connect Stripe for secure payouts.
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
- Pay securely at checkout with supported card methods.
- Your payment is processed before the seller ships.

## Sellers
- ROVEXO collects payment and releases seller payouts after order milestones.
- A platform commission applies to completed sales.
- Connect Stripe from your seller wallet to receive payouts.`,
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
- Refunds depend on the issue and buyer protection eligibility.
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
- Choose standard or express delivery where available.
- Delivery fees are shown before you pay.

## Seller responsibilities
- Ship within the stated handling time.
- Add tracking when available from your seller order page.
- Package items securely to prevent damage in transit.`,
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
- **Awaiting shipment** — payment received, seller preparing item
- **Shipped** — tracking available when provided
- **Delivered** — carrier confirms delivery
- **Completed** — buyer confirmed receipt

Contact the seller through Messages if tracking stalls.`,
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
    title: "Pro Seller dashboard",
    category: "pro-seller",
    summary: "Track sales, analytics, and promotions.",
    keywords: ["dashboard", "analytics", "sales", "pro"],
    content: `# Pro Seller dashboard

Your seller dashboard shows:
- Daily sales and order counts
- Revenue and conversion trends
- Active featured listings and bumps
- Recent orders and low-stock alerts

Open **Analytics** for detailed charts and CSV export.`,
  },
  {
    slug: "pro-seller-promotions",
    title: "Featured listings and bumps",
    category: "pro-seller",
    summary: "Promote listings to reach more buyers.",
    keywords: ["featured", "bump", "promotion"],
    content: `# Featured listings and bumps

## Featured listings
- Highlight items in discovery sections for a set duration.

## Bumps
- Move listings higher in category results temporarily.

Promotions expire automatically. You receive a notification when a promotion ends.`,
  },
  {
    slug: "business-accounts-setup",
    title: "Business accounts",
    category: "business-accounts",
    summary: "Register as a business seller on ROVEXO.",
    keywords: ["business", "company", "inventory", "vat"],
    content: `# Business accounts

Business accounts support higher-volume selling and inventory tools.

## Registration
- Choose **Business Sole Trader** or **Business Company** during seller tax registration.
- Provide accurate company details and VAT number when applicable.
- Complete Stripe Connect for payouts.

Business sellers must comply with commercial selling regulations.`,
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

The following are not allowed on ROVEXO:

- Weapons, ammunition, and weapon accessories
- Illegal drugs and prescription medicines sold without authorisation
- Counterfeit or replica branded goods presented as authentic
- Adult content and escort services
- Stolen goods
- Fake identity documents
- Explosives and dangerous chemicals
- Animal abuse content
- Tobacco, vapes, and alcohol where restricted

Listings may be removed without notice. Repeated violations may lead to account suspension.`,
  },
  {
    slug: "community-guidelines",
    title: "Community guidelines",
    category: "community-guidelines",
    summary: "Standards for respectful trading on ROVEXO.",
    keywords: ["community", "guidelines", "behaviour", "respect"],
    content: `# Community guidelines

ROVEXO is built on trust. All members must:

- Be honest in listings and messages
- Respect other users
- Not harass, threaten, or discriminate
- Not spam or manipulate reviews
- Follow applicable laws

We may restrict accounts that harm the community.`,
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

ROVEXO processes personal data to operate the marketplace, prevent fraud, and improve the service.

## Data we collect
- Account details (name, email, profile information)
- Transaction and messaging metadata
- Device and usage data for security and performance

## Your rights
- Access, correct, or delete your data subject to legal retention requirements
- Manage marketing and notification preferences in Settings

Contact Support for privacy requests. We respond within applicable legal timeframes.`,
  },
  {
    slug: "terms-of-service",
    title: "Terms of service",
    category: "terms",
    summary: "Agreement between you and ROVEXO.",
    keywords: ["terms", "service", "legal", "agreement"],
    content: `# Terms of service

By using ROVEXO you agree to:

- Provide accurate account and listing information
- Comply with prohibited items and community guidelines
- Use ROVEXO checkout for eligible transactions
- Accept platform fees on seller transactions

ROVEXO may update these terms. Continued use after changes constitutes acceptance.

Disputes are handled under Irish/EU consumer law where applicable.`,
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
    summary: "Register as Personal, Pro Seller, or Business before payouts.",
    keywords: ["tax", "vat", "utr", "nino", "stripe connect"],
    content: `# Seller tax registration

Before receiving payouts, complete seller tax registration:

## Registration types
- **Personal** — occasional selling
- **Pro Seller** — regular individual selling
- **Business Sole Trader** — self-employed business
- **Business Company** — registered company

Provide accurate details including address and tax identifiers where required. Then connect Stripe for payouts.`,
  },
];

export function getHelpArticle(slug: string): HelpArticle | undefined {
  const article = HELP_ARTICLES.find((entry) => entry.slug === slug);
  return article ? enrichHelpArticle(article) : undefined;
}

export function getHelpArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => article.category === category).map(enrichHelpArticle);
}

export function getAllHelpArticles(): HelpArticle[] {
  return HELP_ARTICLES.map(enrichHelpArticle);
}
