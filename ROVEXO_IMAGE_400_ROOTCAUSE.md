# ROVEXO Image HTTP 400 — Root Cause (Phase R1.1)

**Status:** REPAIRED (invalid reference collapse at map-time)  
**Symptom:** Console / network: `upstream image response failed` · HTTP **400** via `/_next/image`

## Root cause (verified)

`product_images.thumbnail_url` often points at a **derived** Storage path (`…-thumb.jpg`) that was **never written** (or was removed), while `product_images.url` still points at a valid full object.

Browse / Search / Homepage cards preferred the thumb → Next Image Optimizer fetched upstream → Supabase Storage **400** → Owner saw repeated failures.

Evidence class matches GATE 3 (`scripts/gate3-repair-dangling-thumbnails.ts`): repair dangling `thumbnail_url` → `url`.

Secondary: `lib/listings/repository.ts` `mapProductRow` did not expose `imageFullUrl`, so card one-shot thumb→full fallback could not run on Search/Browse products from that mapper.

## Repair (invalid references only — no optimizer redesign)

| Change | File |
|--------|------|
| Collapse derived `-thumb.` refs to full `url` at map-time | `lib/listings/repository.ts` `mapImages` |
| Wire `resolveCardImageSources` + `imageFullUrl` on listing products | `lib/listings/repository.ts` `mapProductRow` / `mapSellerListing` |
| Same derived-thumb collapse before resolve | `lib/products/repository.ts` `primaryCardImages` |

## Remaining (data / ops — not code)

If **both** `url` and `thumbnail_url` point at deleted Storage objects, 400 remains until the listing is re-photographed or rows are cleaned. Optional DB pass: `npx tsx scripts/gate3-repair-dangling-thumbnails.ts` (Owner ops).

## Not changed

SafeImage API · Next `images` config · formats · quality · CDN · ISR.
