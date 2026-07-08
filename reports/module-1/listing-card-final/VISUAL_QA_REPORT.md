# ListingCard Footer — Final Visual Polish

**URL:** http://127.0.0.1:3033/  
**Verified:** 2026-07-06  
**Result:** 20/20 PASS

## Screenshot (localhost)

![Listing card closeup](./listing-card-closeup.png)

Full page: `homepage-mobile-full.png`, `homepage-desktop-full.png`

## Browser inspector — DOM structure

```html
<article data-listing-card="rovexo" class="ListingCard_card__…">
  <a class="ListingCard_link__…">
    <div class="ListingCard_media__…">…</div>
    <div class="ListingCard_body__…">
      <div class="ListingCard_bodyStack__…">
        <div class="ListingCard_priceRow__…">…</div>
        <p class="ListingCard_title__…">Camping tent 4 pers</p>
      </div>
    </div>
    <!-- Footer is direct child of link (full card width) -->
    <div class="ListingCard_statsRow__…">
      <span class="ListingCard_statRating__…">
        <svg fill="#FFC107">…</svg>
        <span class="ListingCard_statRatingValue__…">New</span>
      </span>
      <span class="ListingCard_statViews__…">
        <svg>…</svg>
        <span class="ListingCard_statViewsValue__…">0</span>
      </span>
    </div>
  </a>
</article>
```

## Computed CSS (Playwright audit)

### `.statsRow` (footer)

| Property | Value |
|----------|-------|
| `display` | `flex` |
| `justify-content` | `space-between` |
| `align-items` | `center` |
| `width` | `160px` (100% of card) |
| `height` | `24px` |
| `padding-left` | `12px` |
| `padding-right` | `12px` |
| `gap` | `0px` |
| `font-size` | `13px` |
| `font-weight` | `600` |

### `.statRating` (left)

| Property | Value |
|----------|-------|
| `justify-content` | `flex-start` |
| `color` | `rgb(255, 193, 7)` / `#FFC107` |
| `font-size` | `13px` |
| `font-weight` | `600` |
| `flex` | `0 0 auto` |
| **Left inset from card** | **12px** ✓ |

### `.statViews` (right)

| Property | Value |
|----------|-------|
| `justify-content` | `flex-end` |
| `color` | `rgb(100, 116, 139)` (muted grey) |
| `font-size` | `13px` |
| `font-weight` | `600` |
| `margin-left` | `0px` |
| **Right inset from card** | **12px** ✓ |

### Gold star SVG

| Property | Value |
|----------|-------|
| `fill` | `rgb(255, 193, 7)` / `#FFC107` |

## Layout measurements

```json
{
  "cardWidthPx": 160,
  "footerWidthPx": 160,
  "ratingLeftInsetPx": 12,
  "viewsRightInsetPx": 12,
  "footerFullWidth": true,
  "ratingFlushLeft": true,
  "viewsFlushRight": true
}
```

## Changes applied

1. Moved `statsRow` outside `.body` → direct child of `.link` for true full-width footer bar.
2. Removed `gap: 8px` and `margin-left: auto` on views (pure `space-between`).
3. Set explicit `padding-left/right: 12px`, `gap: 0`, `flex: 0 0 auto` on both stat items.
4. Gold rating text + star at 13px/600; grey eye + views count at 13px.
5. Homepage body height adjusted to 106px (170 + 106 + 24 = 300px card).
