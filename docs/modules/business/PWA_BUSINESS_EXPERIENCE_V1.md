# PWA Business Experience v1

**STATUS:** REVIEW  
**Surface:** ROVEXO PWA only (`http://localhost:3000`)  
**Native:** not modified

## What changed

Account compact row **🚀 Upgrade to Business** opens `/business/information` until canonical onboarding is complete (`hasBusinessProfile` + Stripe Connect verified). After that the same Profile row becomes **🔄 Switch to Business** / **👤 Switch to Individual** via `PATCH /api/business/context` (`active_seller_context`). A successful Business switch navigates immediately to `/business/dashboard` (Business Home). A successful Individual switch returns to `/account`. Stripe Connect is the only Business verification authority. Business Home / Menu reuse existing wallet, orders, listings, inventory, VAT/HMRC, directory, shipping, and Store engines. `seller_context` switches Individual ↔ Business without duplicating marketplace data.

## What did not change

Authentication architecture, Individual Stripe Connect, Sell UI, Checkout, Shipping engine, Address engine, HMRC/VAT data model, Store architecture (no Shop Categories / Featured). Phase C still hides extra Account-nav Business tools and Business Bank.

## Flow

ACCOUNT → BUSINESS INFORMATION → CONNECT WITH STRIPE → Stripe hosted onboarding → BUSINESS ACTIVE (Stripe verified only) → BUSINESS HOME → BUSINESS MENU → MY STORE (`/store/[slug]`)

## Contact email

The Business Information **Contact email** field shows only a saved Business contact email (`seller_tax_profiles.email`). If none is saved the field is empty with placeholder **Your email**. It never prefills the account/mirror email. Validation and Stripe Connect persistence are unchanged.

## PWA Stripe return URL

`POST /api/business/connect` `{ surface: "pwa" }` builds Account Link `return_url` / `refresh_url` from the reachable request origin (loopback or LAN/dev-host via `Origin`, `Referer`, or `runtimeOrigin`). Production is not hard-coded. Another device must open the local PWA through a reachable LAN/dev-host; one device's localhost is never rewritten onto another machine.

## Seller context switch

`PATCH /api/business/context` writes only `seller_profiles.active_seller_context` (`individual` | `business`) for `auth.user.id` (= `profiles.id` = `seller_profiles.id`). Business is allowed only when Stripe reports verified/ready. Unexpected write failures return HTTP 500 and never `{ success: true }`. Local schema requires migration `20260902180000` — a missing column produced HTTP 400 `Unable to switch seller context.`

Post-success navigation (Account row + Business Menu, one PATCH per click):

- Individual → Business, HTTP 200 → update local context immediately, then App Router `router.push("/business/dashboard")`. Do not stay on `/account`. Do not open `/business/menu` first. Do not full-reload.
- Business → Individual, HTTP 200 → update local context immediately, then `router.push("/account")`.
- 409 / unexpected 4xx/5xx → remain on the current surface and show the existing error. Never navigate after a failed switch. Never flip the Account row to the new context if PATCH failed.

Account row sync (no second seller-context field):

- After a confirmed PATCH, a short-lived same-tab hint is consumed on the first Account paint so a stale RSC `initialStatus` cannot keep the previous label. Later remounts (refresh, logout/login) read `GET /api/business/status` only.
- `/account` remount, browser back, `pageshow`, and `visibilitychange` (document visible) each trigger one `GET /api/business/status` (`cache: "no-store"`). In-flight status requests are shared. No polling.
- The displayed row always follows persisted `active_seller_context`: complete + individual → **🔄 Switch to Business**; complete + business → **👤 Switch to Individual**; incomplete → **🚀 Upgrade to Business**.

## Business Inventory

`/business/inventory` is a Business management surface over the same canonical products. Source: `listInventoryItems()` → `products` (`seller_id`, not deleted) + `product_images`. Stock is `products.stock` via `clampStockLevel`. Low stock reuses per-product `low_stock_alert` (exclusive bucket with `active` / `out_of_stock`). Product count is `items.length`. Search filters the same array by title/SKU. Summary cards filter All / In stock (`active`) / Low stock / Out of stock. Row ⋮ opens Edit product and Manage stock through `editListingHref` → `/seller/listings/[id]/edit` (canonical Sell, no second editor). Delete uses `DELETE /api/listings/[id]` (`deleteSellerListing`) after confirmation, then `GET /api/business/inventory`. Mount / pageshow / visibility refetch that same API. Bulk Pricing is not on this page. Server gates: Stripe verified + `active_seller_context = business`.

## Business Reviews

`/business/reviews` reuses the canonical Seller Review Center (`listSellerReviewCases` → `moderation_queue` by `seller_id`). Unified accounts are not blocked by `profiles.role` (`buyer`). Business surface adds `?surface=business`, which the API rejects unless Stripe is verified and `active_seller_context = business`. Empty success is “No listings under review”. “Unable to load review cases.” is reserved for a failed request. Individual `/seller/review-center` is unchanged.

## Persistence

Reuses `business_accounts`, `seller_profiles.active_seller_context`, canonical addresses, `seller_tax_profiles`, Stripe Connect columns. No new Production migration in this PWA pass.

## Impact

- Performance: Account hub loads existing `loadBusinessStatus` in parallel with wallet/snapshot.
- Responsive: Account Canonical Shell + 16px internal padding.
- Security: APIs remain `requireApiAuth`; verification never trusted from the client; Stripe TEST only for E2E.
- Database: no Production writes.
