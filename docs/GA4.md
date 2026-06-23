# Google Analytics 4 — Production Setup

## Measurement ID

```
G-RNEMD5BT0S
```

## Local development

`.env.local`:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-RNEMD5BT0S
# Optional — load GA in development for debugging
# NEXT_PUBLIC_GA_DEBUG=true
```

GA loads **only in production** (`NODE_ENV=production`) unless `NEXT_PUBLIC_GA_DEBUG=true`.

## Vercel environment variables

Set in **Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-RNEMD5BT0S` |

CLI example:

```bash
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID production
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID preview
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID development
```

Redeploy after adding variables so the client bundle inlines the ID.

## Integration

- Official loader: `@next/third-parties/google` (`GoogleAnalytics`)
- Root layout: `components/analytics/GoogleAnalytics.tsx`
- Client route changes: `page_view` via `GoogleAnalyticsPageView`
- Custom events: `lib/analytics/marketplace-events.ts`

## Automatic GA4 events

Loaded via gtag config (Enhanced Measurement in GA4 property):

- `page_view` (initial load + client navigations)
- `session_start`
- `first_visit`
- `user_engagement`

## Verify in browser

1. Open production site.
2. DevTools → Network → filter `google-analytics` or `collect`.
3. Confirm requests to `https://www.google-analytics.com/g/collect` or `googletagmanager.com`.
4. GA4 → Reports → Realtime — active users within ~30 seconds.

## Marketplace custom events

| Helper | Event |
|--------|-------|
| `trackMarketplaceSearch` | `search` |
| `trackViewListing` | `view_listing` |
| `trackSaveListing` | `save_listing` |
| `trackShareListing` | `share_listing` |
| `trackContactSeller` | `contact_seller` |
| `trackStartCheckout` | `start_checkout` |
| `trackPurchase` | `purchase` |
| `trackCreateListing` | `create_listing` |
| `trackEditListing` | `edit_listing` |
| `trackDeleteListing` | `delete_listing` |
| `trackMarketplaceLogin` | `login` |
| `trackMarketplaceRegister` | `register` |
| `trackAuctionView` | `auction_view` |
| `trackAuctionBid` | `auction_bid` |
| `trackWatchlistAdd` | `watchlist_add` |
| `trackTrustProfileView` | `trust_profile_view` |
