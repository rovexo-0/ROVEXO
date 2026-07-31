# ROVEXO v1.0.0 Release Candidate 1 — Release Notes

**Version:** `1.0.0-rc.1` · **Code:** RC1 · **Status:** Release Candidate (pre-deploy freeze)  
**Date:** 2026-07-30  
**Official Owner URL:** https://www.rovexo.co.uk  

## Major features

- UK marketplace core: browse, search, list, offer, buy, pay, ship, track, review
- Purchase protection / escrow-oriented order lifecycle via Conversation Hub
- Unified ROVEXO Account (buy + sell on one account)
- Compact Premium mobile-first UI with Full Width internal layout (16px) and Homepage 24px pad

## Marketplace modules (frozen for RC1)

| Module | Route / surface |
|--------|-----------------|
| Homepage | `/` |
| Browse / Categories | Catalog Master (10 roots) |
| Search | `/search` · SEARCH_UI_v1.0 |
| Sell | `/sell` · Sprint V locked |
| Listings / Product | `/listing/[slug]` |
| Messages / Inbox Hub | `/inbox` |
| Offers / Counter Offers | Conversation Hub |
| Orders | `/orders` |
| Wallet / Balance | `/wallet` · `/balance` |
| Checkout | `/checkout` · CHECKOUT_UI_v1.0 |
| Notifications | Inbox Event Engine |
| Profile / Settings | `/account` · `/account/settings` |
| HMRC Reporting Centre | Seller compliance / tax surfaces |
| Legal Centre | `/legal/*` |
| Help Centre | `/help` |

## PWA support

- Web App Manifest (standalone, theme `#050508`, maskable + Apple icons)
- Service Worker cache `rovexo-static-v15`
- Offline page `/offline`
- Installable on supported browsers (live device cert still Owner gate)

## HMRC Reporting Centre

- Digital platform reporting education and seller tax / compliance surfaces
- Threshold engine, CSV export paths, legal notice documents (authenticated flows)

## Legal Centre

- Canonical legal documents (Terms, Privacy, Cookies, Marketplace Rules, Seller/Buyer/Wallet/Payment Terms, Verification, Accessibility, GDPR, Data Retention, Shipping, Returns, Fees, Complaint Policy, Account Suspension, Prohibited Items, Community Guidelines)
- Phase C.1 removed Business Seller Terms from SSOT (redirect pending live deploy)

## Help Centre

- Help topics, policies, decision trees aligned to marketplace flows

## Messages & Orders

- Inbox Hub as Transaction Hub
- Conversation Hub single-scroll order experience (Blood VII / VIII)
- Photo attachments in messages (Phase A.2)

## Wallet

- Balance, withdraw, bank accounts, payment methods, transactions (Sprint IV)

## Performance / accessibility / security

- Security headers (CSP, HSTS, XFO, Referrer-Policy, COOP)
- Image safety via `SafeImage`
- Production build + Vitest certification suite
- SEO: robots + multi-sitemap children; root `/sitemap.xml` index fix in workspace (pending deploy)

## Known limitations

See `KNOWN_ISSUES.md` — verified items only.

## Future roadmap (v1.1)

- Public Google / Apple OAuth UI (when Owner re-authorizes; Cluster 6 currently email-only public UI)
- Facebook OAuth (deferred)
- Expanded HTML branded email templates
- Post-deploy Phase D.2 live certification close-out
- Non-critical UX polish deferred from RC1 freeze

## What this release is not

- Not Production LOCK
- Not a public launch authorization
- Not a GitHub Push or Vercel Production Deploy (Owner-gated after RC1 review)
