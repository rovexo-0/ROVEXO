# ROVEXO Request Trace — Phase R1.1

**Scope:** Owner-reported duplicate / slow request patterns  
**Host:** `http://localhost:3000`

## 1. Repeated `GET /api/inbox/badge`

### Trace

```
Page navigation (Home ↔ Browse ↔ Account ↔ …)
  → each page mounts its own <BetaAppShell>
    → new <RealtimeNotificationProvider>
      → useEffect → refresh()
        → fetchBadgeState()
          → fetchInboxBadgeCounts()
            → GET /api/inbox/badge
```

Also: realtime / visibility / online / `rovexo:inbox-sync` / service-worker `notification-sync` → `refresh()`.

### Root cause

**Not** duplicate provider instances in one tree.  
**Yes** — `BetaAppShell` is **per-page**, so every client navigation remounts the provider → mount effect → badge GET. Prior inflight coalesce cleared on `finally`, so remount after settle always refetched.

### Repair

Module-level **2.5s TTL cache** on `fetchInboxBadgeCounts` in `RealtimeNotificationProvider.tsx`. Remounts within TTL reuse last payload (no network). Realtime refresh after TTL still updates.

### Not changed

Inbox Event Engine · Conversation Hub · badge API contract · moving provider to root layout (would be architecture move).

---

## 2. Account page (~4.4s Owner)

### Trace

```
GET /account
  → await fetchProfile()          // blocking
  → Promise.all([
       fetchWalletData(),
       fetchAccountHubSnapshot → 4 DB counts,
       getSellerPerformanceSummary,
       getAppSettings,
     ])
```

### Bottleneck

Strict **profile → then everything** waterfall. Wallet only needs session auth and can start with profile.

### Repair

Start `fetchWalletData()` in parallel with `fetchProfile()`; then `Promise.all` remaining profile-dependent work (`app/(platform)/account/page.tsx`).

---

## 3. Browse page (~2.7s Owner)

### Trace

```
GET /browse
  → getCanonicalBrowseCategoryCounts()
    → for each of 10 roots:
         resolveCategoryPage
         countEligibleListings
           → historically: getEligibleListings(pageSize=1)   // probe
           → then: getEligibleListings(pageSize=dbTotal)     // full recount
```

### Bottleneck

Up to **20** eligible listing fetches (probe + full × 10 roots). Verified cause of Browse counter latency.

### Repair

`countEligibleListings`: first page `pageSize=48` (exact when match set ≤ 48); only then full recount for large categories (`lib/listings/eligible-listings.ts`).

---

## 4. Image 400 / ChunkLoad / Delete

See dedicated root-cause docs:

- `ROVEXO_IMAGE_400_ROOTCAUSE.md`
- `ROVEXO_CHUNKLOAD_ROOTCAUSE.md`
- `ROVEXO_DELETE_LISTING_ROOTCAUSE.md`
