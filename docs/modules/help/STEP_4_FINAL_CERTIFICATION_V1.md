# Help / Legal / Privacy / Support — Step 4 Final Cleanup + Certification

**STATUS: REVIEW**  
**Scope:** Repository scan, dead-link close, audience isolation, security, public surfaces, regression. No CMS. No Legal rewrite. No migrations. No commit.

## What changed

- Shared Help markdown no longer embeds Business-only `/help/business-storefront-tips`
- Help article route strips out-of-audience `relatedArticleSlugs` before RSC serialize
- Removed unused exclusive leftover: `HelpAssistant.tsx`, `lib/help/i18n.ts`, `LegalInformationSection.tsx`, unused `getArticleSections`
- Related Help categories skip legacy topic slugs (`HelpRelatedContent`)
- Unified-account Help copy no longer uses the forbidden “seller account” / “account type” substrings
- Added `BUSINESS_ONLY_HELP_ARTICLE_SLUGS` on the existing audience SSOT
- Added Step 4 certification tests (`tests/help-step-4-final-certification-v1.test.ts`)

## What did not change

- Approved Help IA (8 current categories)
- Legal in-code SSOT, Privacy Policy vs Privacy Settings split
- Support `support_tickets` engine
- Auth, Stripe, Checkout, Shipping, Wallet, Inbox, Orders
- Business menu (still no Settings / Reviews / Directory / Verification)
- No Help CMS, no Legal CMS, no `/help-v2`, no second search engine
- No Production writes, no migrations applied

## Isolation (server authority)

| Viewer | Allowed audiences |
|---|---|
| Guest | shared |
| Individual | shared + individual |
| Business | shared + business |

Authority: `getAuthContext()` + `loadActiveSellerContext(userId)` only.

## STEP_3_E2E

`BLOCKED_EXTERNAL` while the Owner `mishuu` auth fixture is unavailable. Not unblocked in this step.

## Closeout 2026-09-04

Local GoTrue was already healthy (`127.0.0.1:54321`). Read-only blocked suites re-ran PASS. Mutative AVIF backfill/upload tests were **not executed**. Full authorized Vitest 6671 PASS. Typecheck / ESLint (0 errors) / production build PASS. Mishuu fixture still absent → `FINAL_CERTIFICATION = BLOCKED_EXTERNAL`.
