import { LEGAL_SUPPORT_EMAIL } from "@/lib/legal/content";
import type { LegalDocument } from "@/lib/legal/types";
import { LEGAL_EFFECTIVE_DATE, LEGAL_OPERATOR_BLOCK } from "@/lib/legal/document-shared";

/** ROVEXO Legal SSOT — UI Lock + Legal Lock v1.0. Original documents for the implemented platform. */
export const CANONICAL_LEGAL_DOCUMENTS: LegalDocument[] = [
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
These Terms & Conditions govern access to and use of ROVEXO, including browsing, buying, selling, messaging, Wallet features, and support. By creating an account or using ROVEXO you agree to these terms.

## 2. Your ROVEXO account
ROVEXO uses one universal account type. The same account can buy and sell. You must provide accurate registration details, keep credentials secure, and notify us of unauthorised access through Settings → Privacy & Security or Contact Support.

## 3. Marketplace role
${LEGAL_OPERATOR_BLOCK.split("\n")[0]} provides the technology, checkout, payment routing, moderation tooling, and customer support infrastructure. Independent sellers remain responsible for their listings, descriptions, pricing, dispatch, and compliance with applicable law unless ROVEXO expressly states otherwise for a specific programme.

## 4. Buying on ROVEXO
Buyers may purchase items through ROVEXO checkout, save items, message sellers, and manage orders from the Orders area. You must pay using approved payment methods added in Settings. Buyer-specific obligations are set out in the Buyer Terms, which form part of these terms.

## 5. Selling on ROVEXO
Sellers may publish listings, receive offers, fulfil orders, and receive payouts through the Wallet. Before your first withdrawal or first listing publication, ROVEXO may require a bank account in Settings. Seller obligations are set out in the Seller Terms and Business Seller Terms where applicable.

## 6. Fees
ROVEXO may charge platform fees as described in the Platform Fee Policy. Fees may be deducted from seller proceeds and shown at checkout or in Wallet statements.

## 7. Prohibited conduct
You must comply with the Acceptable Use Policy, Community Guidelines, and Prohibited & Restricted Items Policy. ROVEXO may remove listings, restrict accounts, or suspend access under the Account Suspension Policy.

## 8. Intellectual property
ROVEXO branding, software, and curated content remain our property or our licensors' property. Your content licence terms are described in the Intellectual Property Policy.

## 9. Privacy and cookies
Personal data is processed under the Privacy Policy and Cookie Policy in accordance with UK GDPR.

## 10. Disputes and complaints
Complaints and disputes are handled under the Complaint & Dispute Resolution Policy. Nothing in these terms limits mandatory consumer rights under UK law.

## 11. Changes
We may update these terms to reflect product, legal, or security changes. Material changes will be communicated through the platform or by email where appropriate.

## 12. Governing law
These terms are governed by the laws of England and Wales. Courts in England and Wales have exclusive jurisdiction, subject to mandatory consumer protections.`,
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
DNS EUROPA LTD is the data controller for personal information processed through ROVEXO in the United Kingdom.

## 2. Data we collect
We collect account data (name, email, username, profile photo), address and payment method metadata, order and Wallet transaction records, messages sent through ROVEXO, device and security session data, support tickets, tax profile information for sellers, moderation reports, and notification preferences configured in Settings.

## 3. Why we use data
We process data to provide the marketplace, process payments through Stripe, deliver notifications you enable, prevent fraud, comply with tax and regulatory reporting obligations, improve safety, and respond to support requests.

## 4. Legal bases
Depending on the activity, we rely on contract performance, legitimate interests (such as platform safety and analytics), legal obligation (including digital platform reporting where applicable), and consent where required (such as marketing communications you opt into at registration).

## 5. Sharing
We share data with payment processors, delivery partners where you choose integrated shipping, moderation and security providers, professional advisers, and authorities where required by law. We do not sell personal data.

## 6. International transfers
Where processors operate outside the UK, we use appropriate safeguards such as UK adequacy regulations or contractual protections.

## 7. Retention
Retention periods are set out in the Data Retention Policy. You may request deletion through Settings → Delete Account, subject to legal and financial record-keeping requirements.

## 8. Your rights
UK data subjects may request access, rectification, erasure, restriction, portability, and objection, and may lodge a complaint with the ICO. Contact ${LEGAL_SUPPORT_EMAIL} for requests.

## 9. Children
ROVEXO is not directed at children under 18. Accounts must not be created by minors.

## 10. Security
We apply technical and organisational measures including access controls, audit logging for sensitive actions, and secure payment tokenisation through Stripe.`,
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
Cookies are small text files stored on your device. ROVEXO also uses similar technologies such as local storage for session preferences.

## 2. Strictly necessary cookies
These are required for sign-in, security, checkout, and remembering your session. Without them ROVEXO cannot operate securely.

## 3. Functional cookies
These remember choices such as language, currency, and notification settings configured in Settings.

## 4. Analytics cookies
Where enabled, analytics help us understand feature usage and performance. We use aggregated insights to improve the platform.

## 5. Marketing cookies
If you opt in to receive updates and offers at registration or in Settings, we may use cookies to measure campaign effectiveness. You can withdraw consent through Settings.

## 6. Managing cookies
You can control browser cookies through your device settings. Blocking necessary cookies may prevent account access or checkout.

## 7. Updates
We will update this policy when our cookie practices change materially.`,
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
These Buyer Terms apply when you purchase items through ROVEXO checkout using your ROVEXO account.

## 2. Contract formation
Your order is an offer to buy from the seller. The contract is formed when the seller accepts or ROVEXO confirms the order according to the listing type and checkout flow shown at purchase.

## 3. Payment
You must provide a valid payment method in Settings. Charges are processed securely through Stripe. Platform fees and delivery charges are shown before you place an order.

## 4. Delivery and tracking
Delivery obligations follow the Shipping Policy and the listing's stated dispatch method. Track orders from Orders and notification links.

## 5. Returns and refunds
Returns and refunds are handled under the Returns & Refund Policy and the seller's stated return window where applicable.

## 6. Communication
Keep purchase-related communication on ROVEXO Messages. This supports dispute resolution and safety review.

## 7. Reporting
You may report listings or sellers for counterfeit, unsafe, illegal, or scam concerns using in-product report tools or Contact Support.`,
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
These Seller Terms apply when you list, sell, or receive payouts on ROVEXO using your ROVEXO account.

## 2. Listing accuracy
You must describe items accurately, disclose defects, set truthful prices, and comply with the Prohibited & Restricted Items Policy.

## 3. Fulfilment
Dispatch items within the timeframe stated on the listing. Provide tracking where available. Update order status so buyers receive notifications.

## 4. Payouts and Wallet
Seller proceeds are credited to your ROVEXO Wallet. Withdrawals are submitted from Wallet → Withdraw to the bank account in Settings. Monthly and annual statements are available in Wallet for record keeping.

## 5. Fees
Platform fees are deducted as described in the Platform Fee Policy and visible in Wallet statements.

## 6. Tax and reporting
You are responsible for your tax obligations. ROVEXO may collect seller tax profile information and provide reporting under the Digital Platform Reporting & Tax Notice.

## 7. Verification
ROVEXO may display a verified badge automatically when required profile, payment, and bank information is complete. ROVEXO does not operate a separate manual verification menu.

## 8. Moderation
ROVEXO may remove listings, withhold payouts pending review, or suspend accounts for policy breaches or safety risks.`,
  },
  {
    slug: "business-seller-terms",
    title: "Business Seller Terms",
    summary: "Additional terms for business-verified sellers and inventory sellers.",
    category: "commerce",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Business Seller Terms

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Scope
These terms apply when you sell as a business, company, or professional seller with business verification on your ROVEXO profile.

## 2. Business information
You must provide accurate company name, registration number where applicable, VAT number if registered, and business address. Business information is verified information on your profile — not a separate account type.

## 3. Consumer rights
When selling to consumers in the UK you must comply with applicable consumer protection law, including clear pricing, fair commercial practices, and statutory rights where they apply.

## 4. Invoicing and VAT
Where VAT applies you are responsible for correct VAT treatment, invoicing, and record keeping. ROVEXO statements support reconciliation but do not replace your accounting obligations.

## 5. Inventory and volume selling
Business sellers using inventory tools must keep stock accurate and honour published availability.

## 6. Reporting
Business sellers may be subject to enhanced due diligence, audit logging, and digital platform reporting under UK rules.`,
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
Unless ROVEXO offers a labelled fulfilment programme for a listing, the seller is responsible for packing and dispatch.

## 2. Delivery options
Available delivery methods are shown at checkout based on the listing and seller settings. Buyers should review costs and estimated delivery times before purchase.

## 3. Tracking
When tracking is provided, buyers can open tracking from order notifications and the Orders area.

## 4. Lost or damaged parcels
Buyers should contact the seller through Messages first. If unresolved, use Contact Support with order details. ROVEXO may facilitate dispute resolution under the Complaint & Dispute Resolution Policy.

## 5. Prohibited shipments
Sellers must not ship prohibited or restricted items. See the Prohibited & Restricted Items Policy.`,
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
Sellers may state return windows and conditions on listings. Buyers should review these before purchase.

## 2. Not as described
If an item is materially not as described, contact the seller through Messages and initiate a return request from Orders where available.

## 3. Refund processing
Approved refunds are processed through ROVEXO payment infrastructure. Refunded amounts may appear in Wallet statements for sellers and on the original payment method for buyers depending on the case.

## 4. Exclusions
Custom items, perishable goods, and prohibited items may be excluded from returns where permitted by law and clearly disclosed.

## 5. Chargebacks
Payment chargebacks are handled through Stripe and may be linked to order evidence and Messages history.

## 6. Escalation
Unresolved cases may be escalated through Contact Support. ROVEXO may apply the Complaint & Dispute Resolution Policy.`,
  },
  {
    slug: "platform-fee-policy",
    title: "Platform Fee Policy",
    summary: "How ROVEXO platform fees are calculated and displayed.",
    category: "platform",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Platform Fee Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Purpose
ROVEXO charges platform fees to operate the marketplace, payment routing, support, moderation, and safety systems.

## 2. Display
Fees are shown during checkout, in the cart summary, and in seller Wallet statements as Platform Fees.

## 3. Deduction
Seller platform fees are typically deducted from sale proceeds before Wallet credit unless otherwise stated at listing or checkout.

## 4. Changes
Fee rates or structures may change with notice through the platform or seller communications where required.

## 5. Taxes
Fees are stated exclusive of VAT unless otherwise indicated. VAT treatment follows applicable UK rules.`,
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
You must use ROVEXO lawfully and respect the rights of others.

## 2. Prohibited behaviour
Do not harass users, manipulate reviews, circumvent fees, scrape the platform without permission, upload malware, impersonate others, or use ROVEXO for unlawful gambling, weapons trafficking, or fraud.

## 3. Account integrity
One person must not operate multiple accounts to evade enforcement. Do not share accounts in ways that compromise security.

## 4. Automated access
Bots and automated purchasing tools are prohibited unless ROVEXO provides a documented API or integration.

## 5. Enforcement
Violations may result in content removal, feature restrictions, or account suspension.`,
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
Treat buyers, sellers, and support staff respectfully in Messages, reviews, and Ideas submissions.

## 2. Honest listings
Use your own photos where possible, disclose wear and defects, and do not mislead buyers about authenticity or condition.

## 3. Fair reviews
Reviews should reflect genuine experiences. Do not trade reviews or post retaliatory content.

## 4. Privacy
Do not share another person's personal data in public areas or Messages without consent.

## 5. Reporting
Use Report Listing or Report Seller tools when you believe content violates policy.`,
  },
  {
    slug: "prohibited-restricted-items",
    title: "Prohibited & Restricted Items Policy",
    summary: "Items that cannot be sold or are restricted on ROVEXO.",
    category: "platform",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Prohibited & Restricted Items Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. Prohibited items
You may not list illegal items, stolen goods, counterfeit products, unlicensed medicines, offensive weapons, live animals where unlawful, hate material, or items that violate third-party rights.

## 2. Restricted items
Some categories require additional disclosures, age restrictions, or compliance checks. Listings may be held for moderation before publication.

## 3. Product safety
Unsafe products, recalled goods, and items lacking required UK safety markings may be removed. Users should report unsafe listings immediately.

## 4. Enforcement
ROVEXO may remove listings, suspend sellers, and report serious offences to authorities. Repeat offenders face permanent suspension under the Account Suspension Policy.`,
  },
  {
    slug: "intellectual-property-policy",
    title: "Intellectual Property Policy",
    summary: "Copyright, trademarks, and content ownership on ROVEXO.",
    category: "platform",
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    content: `# Intellectual Property Policy

Effective date: ${LEGAL_EFFECTIVE_DATE}

## 1. ROVEXO IP
The ROVEXO name, logos, software, and design systems are owned by DNS EUROPA LTD or its licensors. You may not copy or reverse engineer the platform except as permitted by law.

## 2. Your content
You retain ownership of photos and descriptions you upload. You grant ROVEXO a licence to host, display, and promote listings on the platform and in marketing where permitted by your settings.

## 3. Infringement reports
Rights holders may report infringing listings through Contact Support with evidence of ownership and the listing URL. Counterfeit reports may be submitted through Report Listing.

## 4. Repeat infringement
Accounts with repeated valid infringement reports may be suspended.`,
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
Submit complaints through Help Centre → Contact Support with subject, message, and screenshots where helpful.

## 2. Order disputes
Buyers and sellers should attempt resolution through Messages first. Include order ID and clear photos where relevant.

## 3. ROVEXO review
ROVEXO may review Messages, order data, and payment records. Outcomes may include refunds, account warnings, or listing removal.

## 4. Timeframes
We aim to acknowledge complaints within a reasonable period and provide updates through notifications or email.

## 5. External remedies
UK consumers retain rights to use alternative dispute resolution or courts where applicable law allows.`,
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
ROVEXO may restrict, suspend, or close accounts for policy violations, fraud risk, chargeback abuse, unsafe listings, repeated reports, or legal requirements.

## 2. Actions
Actions may include listing removal, withdrawal holds, messaging limits, or full account suspension.

## 3. Notice
Where appropriate we will notify you through email or in-app notifications with the reason and next steps.

## 4. Appeals
You may appeal through Contact Support with additional context. Appeals are reviewed by moderation staff.

## 5. Repeat offenders
Accounts with repeated serious violations may be permanently banned and reported to authorities where required.`,
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
ROVEXO may be required to collect, verify, and report seller information under UK digital platform reporting rules and related tax legislation.

## 2. Seller tax profile
Sellers may complete a tax profile including tax residency, individual or business status, UTR or TIN where applicable, and optional VAT number. Manage this from Seller Tax Registration and the Compliance Dashboard.

## 3. Due diligence
ROVEXO may perform identity and payout due diligence through Stripe Connect and internal review. Incomplete profiles may limit withdrawals or listing publication.

## 4. Statements and exports
Monthly and annual Wallet statements provide sales, fees, refunds, and withdrawal totals. Sellers may export compliance reports from the Compliance Dashboard for HMRC record keeping.

## 5. Reporting to authorities
Where legally required, ROVEXO may report seller identity and transaction data to HMRC or other competent authorities.

## 6. Your responsibilities
You remain responsible for declaring income and VAT to HMRC. ROVEXO reports do not replace professional tax advice.`,
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
Active account profile data is retained while your account exists. Deleted accounts are purged or anonymised within a reasonable period except where retention is required by law.

## 2. Orders and Wallet
Transaction, order, and statement records are retained for financial, tax, and dispute purposes, typically for at least six years where UK accounting rules apply.

## 3. Messages
Messages may be retained to support disputes, safety investigations, and legal obligations.

## 4. Moderation and audit logs
Reports, moderation decisions, and security audit logs are retained to prevent repeat abuse and demonstrate compliance.

## 5. Support tickets
Support correspondence is retained to resolve issues and improve service quality.

## 6. Requests
You may request erasure through Settings subject to mandatory retention exceptions.`,
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
ROVEXO aims to meet WCAG 2.2 Level AA across core buyer and seller journeys including login, checkout, Settings, Wallet, and Help Centre.

## 2. Measures
We use semantic HTML, keyboard-focus styles, sufficient colour contrast, responsive layouts optimised for mobile-first use, and descriptive labels on forms and buttons.

## 3. Known limitations
Some third-party payment widgets and legacy admin tools may not fully meet our target standard. We work with providers to improve accessibility.

## 4. Feedback
Contact Support through Help Centre if you encounter accessibility barriers. Include the page URL and assistive technology used.

## 5. Enforcement date
This statement is reviewed when major UI releases ship, including the ROVEXO UI Lock programme.`,
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
These Wallet Terms apply to seller balances, withdrawals, and financial statements on ROVEXO.

## 2. Balances
Available, pending, and lifetime earnings are calculated from live wallet transactions in your ROVEXO account.

## 3. Withdrawals
Withdrawals are submitted from Wallet to the bank account in Settings. ROVEXO may delay withdrawals pending verification or fraud review.

## 4. Statements
Monthly and annual statements show opening balance, money received, fees, refunds, withdrawals, and closing balance. PDF and CSV exports are provided for your records.

## 5. Fees
Platform fees deducted from seller proceeds are shown in Wallet statements.`,
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
Buyer payments are processed securely through Stripe. ROVEXO does not store full card numbers on its servers.

## 2. Payment methods
Buyers may save cards and supported wallet methods in Settings → Payment Methods.

## 3. Seller payouts
Seller proceeds are credited to the ROVEXO Wallet before withdrawal to a verified bank account.

## 4. Refunds and chargebacks
Refunds are processed through ROVEXO payment infrastructure and may appear in Wallet statements for sellers.`,
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
Sellers dispatch items within the timeframe shown on the listing unless ROVEXO provides a labelled fulfilment programme.

## 2. Tracking
When provided, buyers open tracking from Orders and notifications.

## 3. Issues
Contact the seller through Messages first, then Contact Support for unresolved delivery issues.`,
  },
];

const bySlug = new Map(CANONICAL_LEGAL_DOCUMENTS.map((document) => [document.slug, document]));

export function getLegalDocument(slug: string): LegalDocument | null {
  return bySlug.get(slug) ?? null;
}

export function listLegalDocuments(): LegalDocument[] {
  return [...CANONICAL_LEGAL_DOCUMENTS];
}

export const LEGAL_DOCUMENT_SLUGS = CANONICAL_LEGAL_DOCUMENTS.map((document) => document.slug);
