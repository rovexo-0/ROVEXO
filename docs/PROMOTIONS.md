# ROVEXO Promotions (Bump + Featured)

Production monetization for seller listings: bumps boost search ranking; featured listings appear in homepage recommended sections.

## Pricing

| Type | Duration | Price |
|---|---|---|
| Bump | 24h | £1.99 |
| Bump | 3d | £4.99 |
| Bump | 7d | £9.99 |
| Feature | 7d | £9.99 |
| Feature | 14d | £14.99 |
| Feature | 30d | £24.99 |

## Purchase flow

1. Seller opens **My Listings** → Bump or Feature
2. `POST /api/promotions/checkout` creates pending row + Stripe Checkout
3. Payment success:
   - Stripe webhook `checkout.session.completed` → `fulfillPromotionFromStripeSession`
   - Redirect confirm `GET /api/promotions/confirm?session_id=...`
4. Promotion activates **only after paid** (dev bypass when Stripe not configured)

Legacy endpoints:
- `POST /api/listings/bump`
- `POST /api/listings/feature`

## Limits

- Bump cooldown: **1 hour** per listing (`BUMP_COOLDOWN_HOURS`)
- Max bumps: **10 per seller per 24h** (`MAX_BUMPS_PER_DAY`)

## Ranking

`promotion_score` on `products`:
- Featured active: +1000
- Bump active: +500 + (bump_count × 10)

Used by search default sort and homepage sections (trending/recommended).

## Analytics

`POST /api/promotions/analytics` tracks impressions/clicks for promoted listings.

Surfaces: `homepage`, `search`, `category`, `listing`, `seller`.

Seller analytics dashboard includes promo CTR and revenue.

## Admin

`/admin/promotions` — list, filter, activate, suspend, expire.

API:
- `GET /api/admin/promotions?stats=1`
- `PATCH /api/admin/promotions/[id]` `{ action: "activate"|"suspend"|"expire" }`
- `POST /api/admin/promotions` manual promotion (admin only)

## Database

Migrations:
- `20250619000002_bump_system.sql`
- `20250620000004_listing_promotions.sql`
- `20250620000007_promotion_checkout_hardening.sql`
- `20250620000009_promotions_production.sql` (analytics, suspended status, stale pending cleanup)

## Cron / maintenance

`refresh_expired_promotions()` runs on read paths and via `/api/cron/maintenance`:
- Expires active promotions past `ends_at`
- Recalculates `promotion_score`
- Fails pending promotions older than 24h

## Stripe webhooks

Subscribe to:
- `checkout.session.completed` (promotion fulfillment)
- `checkout.session.expired` (mark pending failed)

## Environment

Requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`.
