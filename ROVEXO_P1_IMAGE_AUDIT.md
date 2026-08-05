# ROVEXO P1 — IMAGE AUDIT (Homepage)

**STATUS:** AUDITED · NO IMAGE BEHAVIOUR CHANGE

## Surfaces

| Surface | Component | Format | Loading |
|---------|-----------|--------|---------|
| Listing cards (showcase + feed) | `SafeImage` → `next/image` | AVIF → WebP (`next.config` formats) | `priority` for first 3 showcase / 2 feed; else lazy |
| Showcase seller | `Avatar` → `SafeImage` | same | default |
| Header RX icon | `SafeImage` | priority · quality 100 | critical chrome |
| Category rail | text chips only | n/a | n/a |

## Config

- `next.config.ts`: `images.formats = ["image/avif", "image/webp"]`  
- Default card `sizes`: `(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 220px`  
- No product-thumb `<link rel="preload">` (correct — avoid over-preload)

## Findings

1. Formats already optimal for mobile.  
2. Priority budget is small and appropriate.  
3. Category rail does not download category heroes on Homepage (cheap).  
4. **No P1 image API/format change** — would risk visual/functional regressions.

## Expected gains from P1 image work

None applied — already aligned with Performance Program image rules. Further work is Phase P2+ if Owner wants card `sizes` tuning with visual QA.
