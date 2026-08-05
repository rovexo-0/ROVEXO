# R1.3 INDEXEDDB AUDIT — Sell Draft Photos

**STATUS:** MEASURED · RESTORE SANITIZE APPLIED  
**SCOPE:** Client draft photo persistence only  
**DATE:** 2026-08-04

---

## Database

| Field | Value |
|-------|--------|
| Database name | `rovexo-sell-draft` |
| DB version | `1` |
| Object store | `photos` |
| Key path | `id` |
| Implementation | `lib/sell/draft-photo-storage.ts` |

## Record shape (`StoredPhotoRecord`)

| Field | Role |
|-------|------|
| `id` | Photo id (key) |
| `order` | Sort order |
| `mimeType` | Blob MIME |
| `blob` | Local `File`/`Blob` or `null` |
| `previewUrl` | Local/remote preview |
| `url` | Public storage URL after upload |
| `thumbnailUrl` | Thumb public URL |
| `storagePath` | **Relative** object key (expected `{sellerId}/temp/…`) |
| `thumbnailStoragePath` | Thumb object key |
| `uploaded` | Remote upload claimed |
| `existingImageId` | Edit-listing image id |

**Not stored:** `sellerId`, `sessionId`, `imageFullUrl` as separate keys, `temporaryPath` alias (temp is encoded inside `storagePath`).

## Companion localStorage (not IndexedDB)

| Key | Purpose |
|-----|---------|
| `rovexo:sell-draft` | Text draft fields (photos stripped) |
| `rovexo:sell-upload-session` | Upload `sessionId` |
| `rovexo:sell-database-draft-id` | DB draft product UUID |
| `rovexo:sell-draft-saved-at` | TTL / recovery clock |

---

## Survival matrix (measured from code)

| Event | IndexedDB photos | localStorage text draft | `database-draft-id` |
|-------|------------------|-------------------------|---------------------|
| Soft reload | **Survives** | Survives | Survives |
| Browser restart | **Survives** | Survives | Survives |
| Logout / login (same browser profile) | **Survives (not cleared on auth)** | Survives | Survives |
| Seller / account switch (same profile) | **Survives — ROOT CAUSE** | Survives | May 404 then recreate |
| Explicit `clearSellDraft` / discard | Cleared | Cleared | Cleared |
| Draft TTL expiry (`detectRecoverableDraft`) | Cleared via discard | Cleared | Cleared |

**Root survival fact:** IndexedDB is **origin-scoped**, not **auth-user-scoped**. No `ownerSellerId` was stored; restore trusted `storagePath` blindly.

---

## Expected vs actual on restore (pre-fix)

| | Value |
|--|--------|
| Expected `storagePath` | `{currentAuthUserId}/temp/{sessionId}/{filename}.jpg` |
| Actual restored (failure class) | Path that **fails** `startsWith(currentAuthUserId + "/")` — typically `{otherUserId}/temp/…` or a public URL |
| First divergence | Restore merge into Sell draft **before** `POST /api/sell/draft` |

---

## Why stale draft survived (not assumed — code evidence)

1. **No account binding** on photo records.  
2. **Logout does not clear** `rovexo-sell-draft` IndexedDB.  
3. **Restore path** (`loadDraftPhotos` → SellProvider / `loadLocalDraftForRestore`) rehydrated `uploaded + storagePath` without ownership check.  
4. **Repository gate is correct** and was the first hard fail; invalid data was supplied by restore.  
5. Session logs showed **0×** `POST /api/listings/upload` before failing draft — proves restore, not fresh upload.

---

## Post-repair restore behavior

`loadSanitizedDraftPhotos()` (`lib/sell/draft-restore-sanitize-v1.ts`):

- Resolve current `auth.user.id`
- Keep owned paths
- Strip remote metadata when local `File` remains (user can re-upload)
- Discard URL-only foreign photos
- Re-write IndexedDB + clear stale `rovexo:sell-database-draft-id` when uploads were invalidated
