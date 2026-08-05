# ROVEXO P1 — RENDER TREE (Homepage)

**STATUS:** AUDITED · MOBILE FIRST  
**ROUTE:** `/` → `app/(platform)/page.tsx`

```
RootLayout (RSC)
├─ fonts / ChunkLoadRecovery / locale
└─ PageVisibility → Locale → Pwa → Toast → Auth → Avatar → AppShellLayout
   └─ Platform layout
      ├─ SearchProvider + HeaderProvider → RovexoHeaderV2 (dynamic, homepage only)
      └─ page.tsx [RSC · revalidate=60]
         └─ BetaAppShell [client]
            ├─ RealtimeNotificationProvider (inbox/notif badges)
            ├─ BottomNavigation
            └─ HomePageShell
               └─ CanonicalHomepage [client]
                  └─ ScrollContainer
                     ├─ CanonicalCategoryRail          (10 text chips · no images)
                     ├─ FeaturedStoreSection           (≤9 ListingCard + View All)
                     │  └─ FeaturedStoreHeader (Avatar)
                     └─ CanonicalMarketplaceFeed       (infinite ListingCard grid)
                        └─ ListingCard × N
                           ├─ SafeImage (AVIF/WebP via next/image)
                           ├─ useProductWatchlist (shared /api/saved)
                           └─ ShareListingSheet [dynamic · not loaded when showShare=false]
```

## Mount cost notes

| Node | Eager? | Homepage impact |
|------|--------|-----------------|
| CanonicalHomepage children | Eager | Required above-the-fold |
| ListingCard | Eager | Required |
| ShareListingSheet | **Lazy (P1)** | Not fetched on Homepage (`showShare=false`) |
| RovexoHeaderV2 | dynamic | Homepage-only chrome |
| RealtimeNotificationProvider | Eager in BetaAppShell | Badge correctness — left unchanged |
| Wallet / Checkout / Orders / Admin | Not in tree | OK |
