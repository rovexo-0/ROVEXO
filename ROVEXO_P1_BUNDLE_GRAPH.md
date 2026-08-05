# ROVEXO P1 — BUNDLE GRAPH (Homepage)

**STATUS:** AUDITED · ZERO-RISK SPLITS APPLIED WHERE SAFE

## Critical path (must load)

- `app/(platform)/page.tsx` → Canonical Homepage CSS + header-v2 CSS  
- `CanonicalHomepage` + FeaturedStore + MarketplaceFeed  
- `ListingCard` + SafeImage + watchlist hook + format helpers  
- Platform chrome: AuthProvider, Header (homepage), BottomNav, RealtimeNotification  

## Must NOT load on Homepage (verified off tree)

- Wallet / Balance hubs  
- Checkout wizard  
- Orders / Conversation Hub body  
- Admin / Super Admin / Business dashboards  
- Stripe provider  

## P1 change

| Module | Before | After |
|--------|--------|-------|
| `ShareListingSheet` (+ ModalContainer) | Static import from every `ListingCard` | `next/dynamic` — loaded only when `showShare` renders the sheet |

Homepage ListingCards use `HP_CANONICAL_LISTING_PROPS` with `showShare: false` → share chunk stays off the Homepage network waterfall.

## Remaining bundle risks (not changed — behaviour risk)

| Risk | Why deferred |
|------|----------------|
| Eager CanonicalMarketplaceFeed + FeaturedStore | Lazy would delay paint / change perceived UX |
| RealtimeNotificationProvider on `/` | Removing changes badge behaviour |
| Client page-1 feed reconcile | Intentional ISR freshness — changing alters listing correctness |

## Expected gain

Smaller initial JS parse for Homepage card grid (share sheet + modal code deferred until a surface with `showShare` opens the sheet).
