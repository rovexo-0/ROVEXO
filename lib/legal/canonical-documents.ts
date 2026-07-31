import type { LegalDocument } from "@/lib/legal/types";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_OPERATOR_BLOCK,
  LEGAL_SUPPORT_EMAIL,
  LEGAL_WEBSITE_URL,
} from "@/lib/legal/document-shared";
import { buildProhibitedRestrictedItemsPolicyMarkdown } from "@/lib/documentation/prohibited/build-prohibited-restricted-items-policy-v1";
import { LEGAL_CENTRE_EXTRA_DOCUMENTS } from "@/lib/legal/content/legal-centre-extra-documents-v1";
import { LEGAL_CENTRE_REQUIRED_SLUGS } from "@/lib/legal/legal-centre-consolidation-v1";

/**
 * ROVEXO Legal SSOT — UI Lock + Legal Lock v1.0 · Phase C.3 documentation rewrite.
 *
 * Every document below uses a consistent, professional marketplace structure:
 * numbered chapters, each carrying plain-English "What / Why / When / How /
 * Example / Notes / Important" call-outs where natural, a "Common questions"
 * chapter, and a closing "Related Documents" chapter that links to the other
 * /legal/{slug} pages plus Settings, Help Centre, Contact Support, and — where
 * relevant — Privacy, Security, and Verification.
 *
 * Personal Account only (Phase C.1). This file must never introduce a second
 * commercial account product, a separate seller dashboard route, forced-role
 * "upgrade to sell" language, or a social feed framing for Follow relationships.
 */
export const CANONICAL_LEGAL_DOCUMENTS_CORE: LegalDocument[] = [
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    summary: "The contract between you and ROVEXO when using the marketplace.",
    category: "terms",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Terms & Conditions

${LEGAL_OPERATOR_BLOCK}

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. About these terms

**What:** These Terms & Conditions are the contract between you and ROVEXO. They cover browsing, buying, selling, messaging, Wallet features, and support.

**Why:** A single, plain-English contract keeps buying and selling predictable for everyone on the marketplace.

**How:** By creating a Personal Account or using ROVEXO you agree to these terms, together with the Buyer Terms and Seller Terms that apply to specific activities.

**Important:** If you do not agree with these terms, do not create an account or use ROVEXO.

## 2. Your ROVEXO account

**What:** ROVEXO provides one account type — the **Personal Account**.

**Why:** One account keeps things simple: the same login can buy and sell without switching accounts or roles.

**How:** You must provide accurate registration details, keep your password and sign-in methods secure, and notify us of unauthorised access through **Settings → Privacy & Security** or **Contact Support**.

**Example:** A buyer who later wants to sell an item does not need a new account or approval step — they simply publish a listing from Sell using the same Personal Account.

**Notes:** ROVEXO does not offer separate buyer, seller, or commercial account products in v1.0.

## 3. Marketplace role

**What:** DNS EUROPA LTD operates the ROVEXO technology platform: Search, Browse, Sell, Checkout, payment routing, Messages (Conversation), Offers, Orders, Wallet, Shipping Labels, Notifications, Ratings, Reviews, moderation tooling, and customer support infrastructure.

**Why:** Being clear about our role helps you understand who is responsible for what.

**How:** Independent sellers remain responsible for their own listings, descriptions, pricing, dispatch, and compliance with applicable law, unless ROVEXO expressly states otherwise for a specific programme.

## 4. Buying on ROVEXO

**What:** Buyers can browse and search listings, save items (Saved), make Offers, message sellers in Conversation, purchase through Checkout, and manage Orders.

**How:** You must pay using an approved payment method saved in Settings. Buyer-specific obligations are set out in full in the [Buyer Terms](/legal/buyer-terms), which form part of these terms.

**Example:** Making an Offer below the listed price starts a negotiation in Conversation; the seller can accept, decline, or counter it.

## 5. Selling on ROVEXO

**What:** Sellers can publish listings from Sell, receive Offers and messages, fulfil Orders, print Shipping Labels where available, and receive payouts through the ROVEXO Wallet (shown as Balance).

**Why:** Selling uses the same tools and the same Personal Account as buying — there is no separate seller onboarding product.

**How:** Sellers may turn on **Holiday Mode** from My Account to temporarily hide active listings from buyers while away. Before your first withdrawal or first listing publication, ROVEXO may require a linked bank account.

**Important:** Full seller obligations are set out in the [Seller Terms](/legal/seller-terms).

## 6. Fees

**What:** ROVEXO may charge platform fees, described in full in the [Platform Fee Policy](/legal/platform-fee-policy).

**How:** Fees may be deducted from seller proceeds and shown at Checkout or in Wallet statements.

## 7. Ratings and Reviews

**What:** After eligible completed Orders, buyers and sellers may leave Ratings and Reviews.

**Why:** Genuine feedback builds trust across the marketplace.

**Important:** Manipulation of Ratings or Reviews is prohibited under the [Acceptable Use Policy](/legal/acceptable-use-policy) and [Community Guidelines](/legal/community-guidelines).

## 8. Prohibited conduct

**What:** You must comply with the [Acceptable Use Policy](/legal/acceptable-use-policy), [Community Guidelines](/legal/community-guidelines), and [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items).

**How:** ROVEXO may remove listings, restrict accounts, or suspend access under the [Account Suspension Policy](/legal/account-suspension-policy).

## 9. Intellectual property

**What:** ROVEXO branding, software, and curated content remain our property or our licensors' property.

**How:** Your content licence terms — including copyright notices and takedown requests — are described in the [Intellectual Property & Notice and Takedown Policy](/legal/intellectual-property-policy).

## 10. Privacy and cookies

**What:** Personal data is processed under the [Privacy Policy](/legal/privacy-policy) and [Cookie Policy](/legal/cookie-policy) in accordance with UK GDPR.

## 11. Disputes and complaints

**What:** Complaints and disputes are handled under the [Complaint & Dispute Resolution Policy](/legal/complaint-dispute-resolution).

**Notes:** Nothing in these terms limits your mandatory consumer rights under UK law.

## 12. Changes

**What:** We may update these terms to reflect product, legal, or security changes.

**How:** Material changes will be communicated through the platform or by email where appropriate.

## 13. Governing law

**What:** These terms are governed by the laws of England and Wales.

**Important:** Courts in England and Wales have exclusive jurisdiction, subject to mandatory consumer protections.

## 14. Common questions

- **Do I need separate accounts to buy and sell?** No. Every Personal Account can buy and sell.
- **Where do I see the fees I am charged?** Buyers see them at Checkout as part of the total. Sellers do not pay a Seller Fee (£0) — see the [Platform Fee Policy](/legal/platform-fee-policy).
- **What happens if I break these terms?** ROVEXO may remove content, restrict features, or suspend your account under the [Account Suspension Policy](/legal/account-suspension-policy).
- **How do I raise a complaint?** Use the [Complaint & Dispute Resolution Policy](/legal/complaint-dispute-resolution) or Contact Support.

## 15. Related Documents

- [Buyer Terms](/legal/buyer-terms)
- [Seller Terms](/legal/seller-terms)
- [Privacy Policy](/legal/privacy-policy)
- [Cookie Policy](/legal/cookie-policy)
- [Platform Fee Policy](/legal/platform-fee-policy)
- [Acceptable Use Policy](/legal/acceptable-use-policy)
- [Account Suspension Policy](/legal/account-suspension-policy)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    summary: "How ROVEXO collects, uses, and protects personal data in the UK.",
    category: "privacy",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Privacy Policy

${LEGAL_OPERATOR_BLOCK}

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Who we are

**What:** DNS EUROPA LTD is the data controller for personal information processed through ROVEXO in the United Kingdom.

**How:** Contact us at ${LEGAL_SUPPORT_EMAIL} for any privacy question.

## 2. Data we collect

**What:** We collect Personal Account data (name, email, username, profile photo), addresses, Saved items, listing data and images you upload, Offers, order and Wallet transaction records, payment method metadata (tokenised via Stripe — we do not store full card numbers), Conversation messages and attachments, Shipping Label and tracking references where used, device and security session data, support tickets, seller tax profile information where required for payouts, Holiday Mode and notification preferences configured in Settings, Ratings and Reviews you submit, moderation reports, and cookie/consent preferences.

**Example:** When you list an item for sale, we store the photos, description, price, and category you enter so the listing can appear in Search and Browse.

## 3. Why we use data

**Why:** We process data to run the marketplace (Search, Browse, Sell, Checkout, Messages, Orders, Wallet), process payments through Stripe, deliver the Notifications you enable, prevent fraud, meet tax and regulatory reporting obligations where applicable, improve safety and performance, and respond to support requests.

**Important:** Analytics beyond essential operation only run after you consent — see the [Cookie Policy](/legal/cookie-policy).

## 4. Legal bases

**What:** Depending on the activity, we rely on contract performance, legitimate interests (platform safety and essential analytics), legal obligation (including digital platform reporting where applicable), and consent where required (optional marketing and non-essential cookies).

## 5. Sharing

**What:** We share data with payment processors (Stripe), delivery partners where you choose integrated shipping, moderation and security providers, professional advisers, and authorities where required by law.

**Important:** We do not sell personal data.

## 6. International transfers

**How:** Where processors operate outside the UK, we use appropriate safeguards such as UK adequacy regulations or contractual protections.

## 7. Retention

**What:** Retention periods are set out in full in the [Data Retention Policy](/legal/data-retention-policy).

**How:** You may request deletion through **Settings → Delete Account**, subject to legal and financial record-keeping requirements.

## 8. Your rights

**What:** UK data subjects may request access, rectification, erasure, restriction, portability, and objection, and may lodge a complaint with the ICO.

**How:** Contact ${LEGAL_SUPPORT_EMAIL} to make a request.

## 9. Children

**Important:** ROVEXO is not directed at children under 18. Accounts must not be created by minors.

## 10. Security

**What:** We apply technical and organisational measures including access controls, audit logging for sensitive actions, and secure payment tokenisation through Stripe.

**How:** Read more on our approach to keeping your account safe on the [Security](/security) page.

## 11. Common questions

- **Does ROVEXO sell my data?** No. We never sell personal data to third parties.
- **How do I download or delete my data?** Use **Settings → Delete Account**, or contact ${LEGAL_SUPPORT_EMAIL} for an access or portability request.
- **Who can see my Conversation messages?** Only you, the other party in the conversation, and ROVEXO staff handling safety, disputes, or legal obligations.
- **How is my card information protected?** Card details are tokenised by Stripe — ROVEXO never stores full card numbers.

## 12. Related Documents

- [Cookie Policy](/legal/cookie-policy)
- [Data Retention Policy](/legal/data-retention-policy)
- [Terms & Conditions](/legal/terms-and-conditions)
- [Verification Policy](/legal/verification-policy)
- [Security](/security)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    summary: "How ROVEXO uses cookies and similar technologies.",
    category: "privacy",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Cookie Policy

${LEGAL_OPERATOR_BLOCK}

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. What cookies are

**What:** Cookies are small text files stored on your device. ROVEXO also uses similar technologies such as local storage for session preferences.

**Why:** Cookies let ROVEXO remember who you are between pages so you do not have to sign in repeatedly.

## 2. Strictly necessary cookies

**What:** Cookies required for sign-in, security, Checkout, and remembering your session.

**Why:** Without them ROVEXO cannot operate securely.

**Example:**
- **Supabase Auth session cookies** (\`sb-*\`) — authenticated session
- **Security / CSRF and OAuth state cookies** where used during sign-in flows (for example \`rovexo_oauth_state\` when applicable)

## 3. Functional cookies and local storage

**What:** Cookies and local storage that remember choices needed for a working Personal Account experience.

**Example:**
- **\`rovexo-locale\`** — language preference
- **\`rovexo_cookie_consent_v1\`** (local storage) — stores your cookie consent choice from the cookie banner

**Notes:** Notification preferences and similar Settings choices may also be stored in your account on our servers rather than as browser cookies.

## 4. Analytics cookies

**What:** Cookies that help us understand feature usage and performance in aggregate.

**When:** Analytics run **only after you Accept** on the cookie banner (or equivalent consent).

**Example:**
- **\`rovexo_ga_events\`** — analytics event preference / measurement where enabled

**Important:** If you Reject non-essential cookies, analytics cookies are not used for measurement beyond essential operation.

## 5. Marketing

**What:** Optional marketing emails are controlled by the marketing opt-in at registration or in Settings.

**Notes:** ROVEXO v1.0 does not operate a separate marketing cookie suite beyond the consent and analytics described above.

**How:** You can withdraw marketing consent at any time in **Settings**.

## 6. Managing cookies

**How:** Use the cookie banner choice, your browser settings, and **Settings** where available.

**Important:** Blocking necessary cookies may prevent account access or Checkout.

## 7. Updates

**What:** We will update this policy when our cookie practices change materially.

## 8. Common questions

- **Can I use ROVEXO without any cookies?** Strictly necessary cookies are required to sign in and check out securely; you can reject analytics and still use the marketplace.
- **How do I change my choice later?** Open the cookie banner again from the footer, or adjust preferences in **Settings**.
- **Does ROVEXO use third-party advertising cookies?** No. ROVEXO v1.0 does not run third-party advertising cookies.

## 9. Related Documents

- [Privacy Policy](/legal/privacy-policy)
- [Terms & Conditions](/legal/terms-and-conditions)
- [Data Retention Policy](/legal/data-retention-policy)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "buyer-terms",
    title: "Buyer Terms",
    summary: "Additional terms that apply when you purchase on ROVEXO.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Buyer Terms

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Scope

**What:** These Buyer Terms apply when you purchase items through ROVEXO Checkout using your Personal Account.

**Why:** They sit alongside the [Terms & Conditions](/legal/terms-and-conditions) to explain your rights and responsibilities specifically as a buyer.

## 2. Contract formation

**What:** Your order is an offer to buy from the seller.

**How:** The contract is formed when the seller accepts, or ROVEXO confirms the order, according to the listing type and checkout flow shown at purchase.

## 3. Payment

**What:** You must provide a valid payment method in **Settings**.

**How:** Charges are processed securely through Stripe. The Checkout total includes amounts described in the [Platform Fee Policy](/legal/platform-fee-policy) and applicable delivery charges.

**Important:** Review the total shown at Checkout carefully — it is the amount that will be charged. Seller Fee is £0; Platform Fee is paid by the buyer.

## 4. Delivery and tracking

**What:** Delivery obligations follow the [Shipping Policy](/legal/shipping-policy) and the listing's stated dispatch method.

**How:** Track Orders from **Orders**, the Conversation Hub where linked, and Notification links. Sellers may provide Shipping Labels through ROVEXO where integrated shipping is used.

**Example:** After a seller dispatches an item, you receive a Notification with a tracking link you can open from Orders.

## 5. Returns and refunds

**What:** Returns and refunds are handled under the [Returns & Refund Policy](/legal/returns-refund-policy) and the seller's stated return window where applicable.

## 6. Communication

**Why:** Keeping purchase-related communication in ROVEXO Messages (Conversation) supports dispute resolution and safety review.

**How:** Message the seller directly from the order's Conversation Hub.

## 7. Reporting

**What:** You may report listings or sellers for counterfeit, unsafe, illegal, or scam concerns.

**How:** Use in-product report tools or [Contact Support](/support).

## 8. Common questions

- **When am I charged?** At the point you complete Checkout and the order is placed.
- **What if my item never arrives?** Contact the seller in Messages first, then use [Contact Support](/support) if unresolved — see the [Shipping Policy](/legal/shipping-policy).
- **Can I cancel an order?** This depends on order status; check Orders for available actions or message the seller.
- **How do refunds reach me?** Refunds are returned to your original payment method — see the [Returns & Refund Policy](/legal/returns-refund-policy).

## 9. Related Documents

- [Terms & Conditions](/legal/terms-and-conditions)
- [Shipping Policy](/legal/shipping-policy)
- [Returns & Refund Policy](/legal/returns-refund-policy)
- [Payment Terms](/legal/payment-terms)
- [Complaint & Dispute Resolution Policy](/legal/complaint-dispute-resolution)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "seller-terms",
    title: "Seller Terms",
    summary: "Additional terms that apply when you sell on ROVEXO.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Seller Terms

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Scope

**What:** These Seller Terms apply when you list, sell, or receive payouts on ROVEXO using your Personal Account.

**Why:** Selling uses the same account as buying, so these terms explain the extra responsibilities that come with listing items.

## 2. Listing accuracy

**What:** You must describe items accurately, disclose defects, and set truthful prices.

**Important:** Listings must comply with the [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items).

## 3. Fulfilment

**What:** Dispatch items within the timeframe stated on the listing.

**How:** Provide tracking where available. Print Shipping Labels where ROVEXO integrated shipping is used. Update Order status so buyers receive Notifications.

**Example:** Marking an order as dispatched automatically notifies the buyer and unlocks tracking in their Orders view.

## 4. Holiday Mode

**What:** Holiday Mode temporarily hides your active listings from buyers.

**Why:** It lets you step away — a holiday, illness, or a busy period — without deleting or editing every listing.

**How:** Turn it on from **My Account**. Turn it off to restore visibility.

## 5. Payouts and Wallet

**What:** Seller proceeds are credited to your ROVEXO Wallet (shown as Balance).

**How:** Withdrawals are submitted from **Wallet → Withdraw** to the bank account linked for payouts. Monthly and annual statements are available in Wallet for record keeping.

**Important:** Full Wallet mechanics are set out in the [Wallet Terms](/legal/wallet-terms).

## 6. Fees

**What:** The **Seller Fee is £0**. The **Platform Fee is paid by the buyer** at Checkout, as described in the [Platform Fee Policy](/legal/platform-fee-policy). Seller Wallet credits reflect the item price without a seller commission deduction.

**How:** Buyers see one Checkout total that already includes the Platform Fee. Sellers see proceeds and related Wallet activity in Balance / Wallet.

## 7. Tax and reporting

**What:** You are responsible for your own tax obligations.

**How:** ROVEXO may collect seller tax profile information (for example Personal, Pro Seller, Sole Trader, or Company status used for tax registration) and provide reporting under the [Digital Platform Reporting & Tax Notice](/legal/digital-platform-reporting-tax-notice).

**Notes:** Tax registration status is tax information on your Personal Account — it is not a separate marketplace product or role.

## 8. Verification

**What:** ROVEXO may display a verified badge when required profile, payment, and bank information is complete.

**How:** See the [Verification Policy](/legal/verification-policy) for the full process.

## 9. Moderation

**What:** ROVEXO may remove listings, withhold payouts pending review, or suspend accounts for policy breaches or safety risks.

**Important:** See the [Account Suspension Policy](/legal/account-suspension-policy) for how enforcement works.

## 10. Common questions

- **Do I need a separate account to sell?** No. Any Personal Account can sell using the same login used for buying.
- **When does money reach my Wallet?** Typically after the order is confirmed and any applicable holding period ends — see the [Wallet Terms](/legal/wallet-terms).
- **What happens if I go on holiday?** Turn on Holiday Mode to hide your active listings until you return.
- **Do I need to register for tax separately?** No new account is created; you complete a tax profile on your existing Personal Account — see the [Digital Platform Reporting & Tax Notice](/legal/digital-platform-reporting-tax-notice).

## 11. Related Documents

- [Terms & Conditions](/legal/terms-and-conditions)
- [Wallet Terms](/legal/wallet-terms)
- [Platform Fee Policy](/legal/platform-fee-policy)
- [Verification Policy](/legal/verification-policy)
- [Digital Platform Reporting & Tax Notice](/legal/digital-platform-reporting-tax-notice)
- [Account Suspension Policy](/legal/account-suspension-policy)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    summary: "How delivery works for ROVEXO orders.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Shipping Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Seller responsibility

**What:** Unless ROVEXO offers a labelled fulfilment programme for a listing, the seller is responsible for packing and dispatch.

**Why:** Sellers know their items best and choose packaging suited to what they are sending.

## 2. Delivery options

**What:** Available delivery methods are shown at Checkout based on the listing and seller settings.

**How:** Buyers should review costs and estimated delivery times before purchase.

## 3. Tracking

**What:** When tracking is provided, buyers can open it from order notifications and the **Orders** area.

**Example:** Tapping a Notification like "Your order has shipped" opens the tracking details directly.

## 4. Lost or damaged parcels

**How:** Buyers should contact the seller through Messages first.

**Important:** If unresolved, use [Contact Support](/support) with order details. ROVEXO may facilitate dispute resolution under the [Complaint & Dispute Resolution Policy](/legal/complaint-dispute-resolution).

## 5. Prohibited shipments

**What:** Sellers must not ship prohibited or restricted items.

**How:** See the [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items) for the full list.

## 6. Common questions

- **Who pays for delivery?** The delivery cost shown at Checkout, which the buyer pays as part of the order total.
- **What if my tracking has not updated?** Message the seller first; if there is no update after a reasonable time, contact Support.
- **Can a seller refuse to ship internationally?** Sellers set the delivery options and destinations available on each listing.

## 7. Related Documents

- [Buyer Terms](/legal/buyer-terms)
- [Seller Terms](/legal/seller-terms)
- [Delivery Policy](/legal/delivery-policy)
- [Returns & Refund Policy](/legal/returns-refund-policy)
- [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "returns-refund-policy",
    title: "Returns & Refund Policy",
    summary: "How returns, refunds, and buyer protection work on ROVEXO.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Returns & Refund Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Seller return settings

**What:** Sellers may state return windows and conditions on listings.

**How:** Buyers should review these before purchase.

## 2. Not as described

**What:** If an item is materially not as described, you can request a return.

**How:** Contact the seller through Messages and start a return request from **Orders** where available.

**Example:** An item listed as "new with tags" that arrives worn qualifies as not as described.

## 3. Refund processing

**What:** Approved refunds are processed through ROVEXO payment infrastructure.

**How:** Refunded amounts may appear in Wallet statements for sellers and on the original payment method for buyers, depending on the case.

**When:** Refunds are issued once the return or dispute is approved.

## 4. Exclusions

**What:** Custom items, perishable goods, and prohibited items may be excluded from returns where permitted by law and clearly disclosed.

## 5. Chargebacks

**What:** Payment chargebacks are handled through Stripe.

**How:** They may be linked to order evidence and Messages history.

## 6. Escalation

**How:** Unresolved cases may be escalated through [Contact Support](/support).

**Important:** ROVEXO may apply the [Complaint & Dispute Resolution Policy](/legal/complaint-dispute-resolution).

## 7. Common questions

- **How long do I have to request a return?** This depends on the seller's stated return window on the listing.
- **Where does my refund go?** Back to the original payment method for buyers, or reflected in Wallet statements for sellers.
- **What if the seller disagrees the item is faulty?** Escalate through [Contact Support](/support) with evidence from Messages and photos.

## 8. Related Documents

- [Buyer Terms](/legal/buyer-terms)
- [Seller Terms](/legal/seller-terms)
- [Payment Terms](/legal/payment-terms)
- [Shipping Policy](/legal/shipping-policy)
- [Complaint & Dispute Resolution Policy](/legal/complaint-dispute-resolution)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "platform-fee-policy",
    title: "Platform Fee Policy",
    summary: "Buyer-paid Platform Fee, Seller Fee £0, and how fees appear at Checkout.",
    category: "platform",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Platform Fee Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Purpose

**What:** ROVEXO charges platform fees to operate the marketplace, payment routing, support, moderation, and safety systems.

**Why:** Fees fund the infrastructure that keeps buying and selling safe and reliable for everyone.

## 2. Display

**What:** Fees are shown during Checkout as part of the buyer total. Seller Wallet statements show sale proceeds and related activity; they do not deduct a seller commission (Seller Fee is £0).

**How:** Buyer-facing totals may show an inclusive price indicator without publishing the fee percentage on every surface.

**Example:** A buyer sees one final total at Checkout that already includes the Platform Fee.

## 3. Who pays

**What:** The Platform Fee is paid by the **buyer** at Checkout. The **Seller Fee is £0** — ROVEXO does not deduct a seller commission from the item price.

**How:** Buyer-facing Checkout shows one total that already includes the Platform Fee. Seller Wallet credits are based on the item price without a seller commission line.

**Notes:** Asking buyers to pay outside ROVEXO to avoid fees is prohibited.

## 4. Changes

**How:** Fee rates or structures may change with notice through the platform or seller communications where required.

## 5. Taxes

**What:** Fees are stated exclusive of VAT unless otherwise indicated.

**Important:** VAT treatment follows applicable UK rules.

## 6. Common questions

- **Who pays the Platform Fee?** The buyer. It is included in the Checkout total.
- **Is there a Seller Fee?** No. Seller Fee is £0.
- **Where do I see the exact fee I paid as a buyer?** In Checkout and buyer order summaries as part of the total you pay.
- **Can fees change on listings I already published?** Fee changes are communicated in advance and generally apply going forward.

## 7. Related Documents

- [Seller Terms](/legal/seller-terms)
- [Buyer Terms](/legal/buyer-terms)
- [Wallet Terms](/legal/wallet-terms)
- [Payment Terms](/legal/payment-terms)
- [Terms & Conditions](/legal/terms-and-conditions)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "acceptable-use-policy",
    title: "Acceptable Use Policy",
    summary: "Rules for safe and lawful use of ROVEXO.",
    category: "platform",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Acceptable Use Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Lawful use

**What:** You must use ROVEXO lawfully and respect the rights of others.

**Why:** Lawful, respectful use keeps the marketplace safe for buyers and sellers alike.

## 2. Prohibited behaviour

**What:** Do not harass users, manipulate reviews, circumvent fees, scrape the platform without permission, upload malware, impersonate others, or use ROVEXO for unlawful gambling, weapons trafficking, or fraud.

**Example:** Asking a buyer to pay outside ROVEXO to avoid platform fees is prohibited fee circumvention.

## 3. Account integrity

**What:** One person must not operate multiple accounts to evade enforcement.

**Important:** Do not share accounts in ways that compromise security.

## 4. Automated access

**What:** Bots and automated purchasing tools are prohibited.

**Notes:** This does not apply where ROVEXO provides a documented API or integration.

## 5. Enforcement

**How:** Violations may result in content removal, feature restrictions, or account suspension under the [Account Suspension Policy](/legal/account-suspension-policy).

## 6. Common questions

- **What counts as fee circumvention?** Arranging payment outside ROVEXO to avoid platform fees for a transaction discovered on ROVEXO.
- **Can I open a second account after a suspension?** No — creating additional accounts to evade enforcement is itself a violation.
- **How do I report abuse?** Use in-product report tools or [Contact Support](/support).

## 7. Related Documents

- [Community Guidelines](/legal/community-guidelines)
- [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items)
- [Account Suspension Policy](/legal/account-suspension-policy)
- [Terms & Conditions](/legal/terms-and-conditions)
- [Security](/security)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "community-guidelines",
    title: "Community Guidelines",
    summary: "Expected behaviour when interacting on ROVEXO.",
    category: "platform",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Community Guidelines

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Respect

**What:** Treat buyers, sellers, and support staff respectfully in Messages, reviews, and Ideas submissions.

**Why:** A respectful marketplace is more pleasant and trustworthy for everyone.

## 2. Honest listings

**What:** Use your own photos where possible, disclose wear and defects, and do not mislead buyers about authenticity or condition.

**Example:** A listing for a used item should show real photos of any marks or wear, not stock images only.

## 3. Fair Ratings and Reviews

**What:** Ratings and Reviews should reflect genuine experiences after eligible Orders.

**Important:** Do not trade Reviews, manipulate Ratings, or post retaliatory content.

## 4. Privacy

**What:** Do not share another person's personal data in public areas or Messages without consent.

## 5. Reporting

**How:** Use **Report Listing** or **Report Seller** tools when you believe content violates policy.

## 6. Common questions

- **What if I receive a rude message?** Report it using the in-product report tools, and it will be reviewed under the [Acceptable Use Policy](/legal/acceptable-use-policy).
- **Can I ask a buyer to change their review?** You may reply professionally through Messages, but you must not offer incentives to change a genuine review.
- **How do I flag a fake listing?** Use **Report Listing** on the listing page.

## 7. Related Documents

- [Acceptable Use Policy](/legal/acceptable-use-policy)
- [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items)
- [Terms & Conditions](/legal/terms-and-conditions)
- [Verification Policy](/legal/verification-policy)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "prohibited-restricted-items",
    title: "Prohibited & Restricted Items Policy",
    summary: "Official ROVEXO marketplace compliance manual — Allowed, Restricted, or Prohibited classifications with individual product rules.",
    category: "platform",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: buildProhibitedRestrictedItemsPolicyMarkdown(),
  },
  {
    slug: "intellectual-property-policy",
    title: "Intellectual Property & Notice and Takedown Policy",
    summary: "Copyright, trademarks, Notice and Takedown, and counter-notice on ROVEXO.",
    category: "platform",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Intellectual Property & Notice and Takedown Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. ROVEXO IP

**What:** The ROVEXO name, logos, software, and design systems are owned by DNS EUROPA LTD or its licensors.

**Important:** You may not copy or reverse engineer the platform except as permitted by law.

## 2. Your content

**What:** You retain ownership of photos and descriptions you upload.

**How:** You grant ROVEXO a licence to host, display, and promote listings on the platform and in marketing where permitted by your settings.

## 3. Notice and Takedown (UK)

**What:** Rights holders who believe content on ROVEXO infringes copyright, trade mark, or other IP rights may submit a formal Notice and Takedown request.

**How to submit a notice:** Email **${LEGAL_SUPPORT_EMAIL}** with subject line **Notice and Takedown**, or use **Help Centre → Contact Support** and select an IP / copyright topic. Include:

1. Your full name, organisation (if any), postal address, email, and phone number.
2. A description of the protected work and proof of ownership or exclusive rights.
3. The exact ROVEXO listing URL(s) or other location of the allegedly infringing material.
4. A statement that you have a good-faith belief the use is not authorised by the rights holder, its agent, or the law.
5. A statement that the information in the notice is accurate, and that you are authorised to act on behalf of the rights holder.
6. Your physical or electronic signature (typed full name is acceptable for email notices).

**Designated contact:** **DNS EUROPA LTD** — Notice and Takedown / IP complaints. Website: ${LEGAL_WEBSITE_URL}. Support: ${LEGAL_SUPPORT_EMAIL}.

**What we do:** We acknowledge valid notices, review the report, and may temporarily hide or remove the listing while the review is open. We aim to act promptly on complete notices. Incomplete notices may be returned for missing details.

## 4. Counter-notice

**What:** If your listing was removed and you believe the removal was a mistake or misidentification, submit a counter-notice.

**How:** Send it to the same contact with:

1. Your name, address, email, and phone number.
2. Identification of the material removed and its former URL.
3. A good-faith statement that the material was removed by mistake or misidentification.
4. Consent to the jurisdiction of the courts of England and Wales.
5. Your signature (typed full name is acceptable for email).

**Notes:** We may restore material after a counter-notice if the original complainant does not pursue further action within a reasonable period and restoration is appropriate.

## 5. Counterfeit and Report Listing

**What:** Buyers and sellers may also use in-app **Report Listing** for suspected counterfeits.

**Important:** Formal rights-holder notices should still use the Notice and Takedown channel above.

## 6. Repeat infringement

**What:** Accounts with repeated valid infringement findings may be restricted, suspended, or permanently banned under the [Account Suspension Policy](/legal/account-suspension-policy).

## 7. Governing law

**What:** This policy is governed by the laws of England and Wales.

## 8. Common questions

- **How long does a takedown review take?** We aim to act promptly on complete notices; incomplete notices may be returned for missing details first.
- **Can I get my listing back if it was removed by mistake?** Yes — submit a counter-notice using the steps above.
- **Where do I report a suspected counterfeit as a buyer?** Use **Report Listing** on the item page.

## 9. Related Documents

- [Terms & Conditions](/legal/terms-and-conditions)
- [Acceptable Use Policy](/legal/acceptable-use-policy)
- [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items)
- [Account Suspension Policy](/legal/account-suspension-policy)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "complaint-dispute-resolution",
    title: "Complaint & Dispute Resolution Policy",
    summary: "How ROVEXO handles complaints and marketplace disputes.",
    category: "governance",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Complaint & Dispute Resolution Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Contact Support

**What:** Submit complaints through **Help Centre → Contact Support** with subject, message, and screenshots where helpful.

**How:** The more detail you include, the faster we can help.

## 2. Order disputes

**What:** Buyers and sellers should attempt resolution through Messages first.

**How:** Include the order ID and clear photos where relevant.

**Example:** For an item-not-as-described dispute, include the order ID, the listing photos, and photos of the item as received.

## 3. ROVEXO review

**What:** ROVEXO may review Messages, order data, and payment records.

**How:** Outcomes may include refunds, account warnings, or listing removal.

## 4. Timeframes

**When:** We aim to acknowledge complaints within a reasonable period and provide updates through notifications or email.

## 5. External remedies

**Important:** UK consumers retain rights to use alternative dispute resolution or courts where applicable law allows.

## 6. Common questions

- **What should I include in a complaint?** Order ID, a clear description of the issue, and any supporting photos or Message screenshots.
- **How will I know the outcome?** Through in-app Notifications and, where appropriate, email.
- **Can I still go to court if I disagree with the outcome?** Yes — this policy does not remove your mandatory consumer rights.

## 7. Related Documents

- [Buyer Terms](/legal/buyer-terms)
- [Seller Terms](/legal/seller-terms)
- [Returns & Refund Policy](/legal/returns-refund-policy)
- [Account Suspension Policy](/legal/account-suspension-policy)
- [Terms & Conditions](/legal/terms-and-conditions)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "account-suspension-policy",
    title: "Account Suspension Policy",
    summary: "When and how ROVEXO restricts or closes accounts.",
    category: "governance",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Account Suspension Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Grounds

**What:** ROVEXO may restrict, suspend, or close accounts for policy violations, fraud risk, chargeback abuse, unsafe listings, repeated reports, or legal requirements.

**Why:** Enforcement protects the safety and trust of the whole marketplace.

## 2. Actions

**What:** Actions may include listing removal, withdrawal holds, messaging limits, or full account suspension.

**Example:** A confirmed counterfeit listing may be removed immediately, with the seller's account placed under review.

## 3. Notice

**How:** Where appropriate we will notify you through email or in-app notifications with the reason and next steps.

## 4. Appeals

**What:** You may appeal through [Contact Support](/support) with additional context.

**How:** Appeals are reviewed by moderation staff.

## 5. Repeat offenders

**Important:** Accounts with repeated serious violations may be permanently banned and reported to authorities where required.

## 6. Common questions

- **Will I always be told why my account was actioned?** Yes, where appropriate, through email or in-app notification with reasons and next steps.
- **Can I appeal a suspension?** Yes — use [Contact Support](/support) with any additional context.
- **Does a withdrawal hold mean I lose my money?** No — a hold is a temporary review step, not a forfeiture, unless fraud is confirmed.

## 7. Related Documents

- [Acceptable Use Policy](/legal/acceptable-use-policy)
- [Prohibited & Restricted Items Policy](/legal/prohibited-restricted-items)
- [Complaint & Dispute Resolution Policy](/legal/complaint-dispute-resolution)
- [Verification Policy](/legal/verification-policy)
- [Security](/security)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "digital-platform-reporting-tax-notice",
    title: "Digital Platform Reporting & Tax Notice",
    summary: "UK seller reporting, tax profile, and HMRC-ready records.",
    category: "compliance",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Digital Platform Reporting & Tax Notice

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Purpose

**What:** ROVEXO may be required to collect, verify, and report seller information under UK digital platform reporting rules and related tax legislation.

**Why:** These are legal obligations placed on platforms like ROVEXO, not a ROVEXO product choice.

## 2. Seller tax profile

**What:** Sellers may complete a tax profile including tax residency, registration status used for tax purposes (Personal, Pro Seller, Sole Trader, or Company), UTR or TIN where applicable, and an optional VAT number.

**How:** Manage this from **Seller Tax Registration**.

**Notes:** This is tax information on your Personal Account — it is not a separate commercial account product.

## 3. Due diligence

**What:** ROVEXO may perform identity and payout due diligence through Stripe and internal review.

**Important:** Incomplete profiles may limit withdrawals or listing publication.

## 4. Statements and exports

**What:** Monthly and annual Wallet statements provide sales, fees, refunds, and withdrawal totals.

**How:** Sellers may use Wallet statements and available compliance exports for HMRC record keeping where provided.

## 5. Reporting to authorities

**What:** Where legally required, ROVEXO may report seller identity and transaction data to HMRC or other competent authorities.

## 6. Your responsibilities

**Important:** You remain responsible for declaring income and VAT to HMRC. ROVEXO reports do not replace professional tax advice.

## 7. Common questions

- **Do I need to register a business to sell?** No — you complete a tax profile on your existing Personal Account; no separate account is created.
- **Where do I find my sales totals for my tax return?** In your Wallet statements, available monthly and annually.
- **Will ROVEXO tell HMRC about my sales?** Where legally required, yes — you remain responsible for your own tax declarations.

## 8. Related Documents

- [Seller Terms](/legal/seller-terms)
- [Wallet Terms](/legal/wallet-terms)
- [Data Retention Policy](/legal/data-retention-policy)
- [Verification Policy](/legal/verification-policy)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "data-retention-policy",
    title: "Data Retention Policy",
    summary: "How long ROVEXO keeps different categories of data.",
    category: "compliance",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Data Retention Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Account data

**What:** Active account profile data is retained while your account exists.

**How:** Deleted accounts are purged or anonymised within a reasonable period except where retention is required by law.

## 2. Orders and Wallet

**What:** Transaction, order, and statement records are retained for financial, tax, and dispute purposes.

**Notes:** Typically for at least six years where UK accounting rules apply.

## 3. Messages

**What:** Messages may be retained to support disputes, safety investigations, and legal obligations.

## 4. Moderation and audit logs

**Why:** Reports, moderation decisions, and security audit logs are retained to prevent repeat abuse and demonstrate compliance.

## 5. Support tickets

**What:** Support correspondence is retained to resolve issues and improve service quality.

## 6. Requests

**How:** You may request erasure through **Settings**, subject to mandatory retention exceptions.

## 7. Common questions

- **How long are my order records kept?** Generally at least six years, in line with UK accounting rules.
- **Can I ask ROVEXO to delete my account data?** Yes, through **Settings → Delete Account**, subject to legal retention exceptions.
- **Are my messages ever kept after I delete my account?** They may be retained where needed for disputes, safety, or legal obligations.

## 8. Related Documents

- [Privacy Policy](/legal/privacy-policy)
- [Digital Platform Reporting & Tax Notice](/legal/digital-platform-reporting-tax-notice)
- [Cookie Policy](/legal/cookie-policy)
- [Security](/security)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "accessibility-statement",
    title: "Accessibility Statement",
    summary: "ROVEXO commitment to accessible design for UK users.",
    category: "compliance",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Accessibility Statement

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Commitment

**What:** ROVEXO aims to meet WCAG 2.2 Level AA across core buyer and seller journeys including login, checkout, Settings, Wallet, and Help Centre.

**Why:** Everyone should be able to buy and sell on ROVEXO, regardless of ability.

## 2. Measures

**How:** We use semantic HTML, keyboard-focus styles, sufficient colour contrast, responsive layouts optimised for mobile-first use, and descriptive labels on forms and buttons.

## 3. Known limitations

**What:** Some third-party payment widgets (for example Stripe elements) may not fully meet our target standard.

**Notes:** We work with providers to improve accessibility over time.

## 4. Feedback

**How:** Contact Support through **Help Centre** if you encounter accessibility barriers.

**Important:** Include the page URL and assistive technology used, so we can reproduce and fix the issue.

## 5. Review

**When:** This statement is reviewed when major public UI releases ship.

## 6. Common questions

- **What standard does ROVEXO target?** WCAG 2.2 Level AA for core buyer and seller journeys.
- **How do I report an accessibility problem?** Use [Contact Support](/support) with the page URL and the assistive technology you used.
- **Are all third-party elements fully accessible?** Some third-party widgets may not fully meet the target standard yet; we work with providers to improve this.

## 7. Related Documents

- [Terms & Conditions](/legal/terms-and-conditions)
- [Help Centre](/help)
- [Contact Support](/support)
- [Settings](/account/settings)`,
  },
  {
    slug: "wallet-terms",
    title: "Wallet Terms",
    summary: "Terms governing ROVEXO Wallet balances, withdrawals, and statements.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Wallet Terms

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Scope

**What:** These Wallet Terms apply to seller balances, withdrawals, and financial statements on ROVEXO.

**Why:** The Wallet is the single home for everything about your seller money — no separate financial dashboards.

## 2. Balances

**What:** Available, pending, and lifetime earnings are calculated from live wallet transactions in your ROVEXO account.

**How:** View them any time from **Wallet**, accessible from My Account as Balance.

## 3. Withdrawals

**What:** Withdrawals are submitted from **Wallet** to the bank account in **Settings**.

**Important:** ROVEXO may delay withdrawals pending verification or fraud review.

**Example:** Withdrawing your available balance sends funds to your linked bank account, usually within the timeframe shown in Wallet.

## 4. Statements

**What:** Monthly and annual statements show opening balance, money received, fees, refunds, withdrawals, and closing balance.

**How:** PDF and CSV exports are provided for your records.

## 5. Fees

**What:** The **Seller Fee is £0**. The buyer-paid **Platform Fee** is described in the [Platform Fee Policy](/legal/platform-fee-policy). Wallet statements show proceeds, refunds, withdrawals, and related activity — not a seller commission deduction from your item price.

## 6. Common questions

- **How do I withdraw my balance?** Open **Wallet → Withdraw** and choose the linked bank account.
- **Why is part of my balance pending?** Funds may be held briefly for order confirmation or fraud review before becoming available.
- **Where can I download a statement for my accountant?** From **Wallet → Statements**, in PDF or CSV format.

## 7. Related Documents

- [Seller Terms](/legal/seller-terms)
- [Platform Fee Policy](/legal/platform-fee-policy)
- [Payment Terms](/legal/payment-terms)
- [Digital Platform Reporting & Tax Notice](/legal/digital-platform-reporting-tax-notice)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "payment-terms",
    title: "Payment Terms",
    summary: "How buyer payments and seller payouts are processed on ROVEXO.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Payment Terms

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Payment processing

**What:** Buyer payments are processed securely through Stripe.

**Important:** ROVEXO does not store full card numbers on its servers.

## 2. Payment methods

**What:** Buyers may save cards and supported wallet methods.

**How:** Manage them from **Settings → Payment Methods**.

## 3. Seller payouts

**What:** Seller proceeds are credited to the ROVEXO Wallet before withdrawal to a verified bank account.

**How:** See the [Wallet Terms](/legal/wallet-terms) for withdrawal steps.

## 4. Refunds and chargebacks

**What:** Refunds are processed through ROVEXO payment infrastructure.

**How:** They may appear in Wallet statements for sellers.

## 5. Common questions

- **Which payment methods can I save?** Cards and supported wallet methods, managed in **Settings → Payment Methods**.
- **Is my card data stored by ROVEXO?** No — card details are tokenised and stored by Stripe, not ROVEXO.
- **What happens to a refund on my card?** It is returned through Stripe to the original payment method.

## 6. Related Documents

- [Buyer Terms](/legal/buyer-terms)
- [Wallet Terms](/legal/wallet-terms)
- [Returns & Refund Policy](/legal/returns-refund-policy)
- [Privacy Policy](/legal/privacy-policy)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "delivery-policy",
    title: "Delivery Policy",
    summary: "Delivery expectations for ROVEXO orders.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Delivery Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Seller responsibility

**What:** Sellers dispatch items within the timeframe shown on the listing.

**Notes:** Unless ROVEXO provides a labelled fulfilment programme for that listing.

## 2. Tracking

**What:** When provided, buyers open tracking from **Orders** and notifications.

**Example:** A shipped-order notification links straight to the courier's tracking page.

## 3. Issues

**How:** Contact the seller through Messages first, then [Contact Support](/support) for unresolved delivery issues.

## 4. Common questions

- **What if my order has not dispatched yet?** Check the listing's stated dispatch time, then message the seller for an update.
- **Where do I find my tracking number?** In the order Notification or in the Orders view for that order.
- **Who do I contact if delivery fails repeatedly?** Message the seller first, then [Contact Support](/support) if unresolved.

## 5. Related Documents

- [Shipping Policy](/legal/shipping-policy)
- [Buyer Terms](/legal/buyer-terms)
- [Returns & Refund Policy](/legal/returns-refund-policy)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
  {
    slug: "verification-policy",
    title: "Verification Policy",
    summary: "How ROVEXO verifies Personal Accounts for marketplace trust.",
    category: "governance",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Verification Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Purpose

**What:** ROVEXO uses verification to protect buyers and sellers, reduce fraud, and meet UK marketplace trust expectations.

**Why:** Verification may support Trust Centre signals and a verified badge on eligible profiles.

## 2. Who can verify

**What:** Every Personal Account can buy and sell, and every Personal Account can request verification.

**Notes:** ROVEXO v1.0 does not provide a parallel commercial account product or separate commercial hub menus. Verification may be requested or required for higher-trust selling and payouts.

## 3. Types of verification

**What:**
- **Identity / profile verification** — confirms account ownership and basic profile integrity (**Settings → Verification**).
- **Payout / bank readiness** — bank and payment details required before withdrawals.
- **Seller reputation signals** — Orders completed, Ratings, Reviews, response behaviour, and Trust Centre history.

## 4. How to request verification

**How:** Open **Settings → Verification** or **Trust Centre**, then complete the requested checks.

**Example:** Adding and confirming a payout bank account is one of the steps that can unlock a verified badge.

## 5. Review and outcomes

**What:** ROVEXO may approve, request more information, or decline a verification request.

**How:** Decisions appear in **Trust Centre** and account Notifications where applicable.

**Important:** A verified badge may display when required profile, payment, and bank information is complete.

## 6. Ongoing checks

**When:** ROVEXO may re-check verification after disputes, chargebacks, prohibited-item reports, or material profile changes.

## 7. Data use

**What:** Verification data is processed under the [Privacy Policy](/legal/privacy-policy) and [Data Retention Policy](/legal/data-retention-policy).

**Important:** Do not submit documents you are not authorised to share.

## 8. Contact

**How:** Questions about verification — use **Help Centre** or **Contact Support**.

## 9. Common questions

- **Does verification create a new account type?** No — verification is a status on your existing Personal Account.
- **What unlocks the verified badge?** Completing the required profile, payment, and bank information checks.
- **Can verification be removed later?** Yes, if a re-check after a dispute, chargeback, or material profile change fails.

## 10. Related Documents

- [Seller Terms](/legal/seller-terms)
- [Privacy Policy](/legal/privacy-policy)
- [Data Retention Policy](/legal/data-retention-policy)
- [Account Suspension Policy](/legal/account-suspension-policy)
- [Security](/security)
- [Settings](/account/settings)
- [Help Centre](/help)
- [Contact Support](/support)`,
  },
];

export const CANONICAL_LEGAL_DOCUMENTS: LegalDocument[] = [
  ...CANONICAL_LEGAL_DOCUMENTS_CORE,
  ...LEGAL_CENTRE_EXTRA_DOCUMENTS,
];

const bySlug = new Map(CANONICAL_LEGAL_DOCUMENTS.map((document) => [document.slug, document]));

export function getLegalDocument(slug: string): LegalDocument | null {
  return bySlug.get(slug) ?? null;
}

export function listLegalDocuments(): LegalDocument[] {
  const ordered: LegalDocument[] = [];
  for (const slug of LEGAL_CENTRE_REQUIRED_SLUGS) {
    const document = bySlug.get(slug);
    if (document) ordered.push(document);
  }
  for (const document of CANONICAL_LEGAL_DOCUMENTS) {
    if (!LEGAL_CENTRE_REQUIRED_SLUGS.includes(document.slug as (typeof LEGAL_CENTRE_REQUIRED_SLUGS)[number])) {
      ordered.push(document);
    }
  }
  return ordered;
}

export const LEGAL_DOCUMENT_SLUGS = CANONICAL_LEGAL_DOCUMENTS.map((document) => document.slug);
