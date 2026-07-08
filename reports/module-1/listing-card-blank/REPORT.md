# Listing Card — Blank-Slate Reconstruction

**Marker:** `data-rx-card` · `data-rx-card-version="1"`  
**Status:** PASS · zero legacy detected

## Architecture

Styling uses **only** `data-rx-part` attributes — no class names that match homepage wildcard selectors (`price`, `title`, `favorite`, `media`, `body`, etc.).

```
[data-rx-card]
├── [data-rx-part="nav"]
│   ├── [data-rx-part="img"] + tag
│   └── [data-rx-part="body"]
│       ├── [data-rx-part="val"]
│       ├── [data-rx-part="copy"] → name, hint
│       └── [data-rx-part="end"] → score, reach
└── [data-rx-part="pin"]
```

## Dimensions (verified localhost)

| Element | Value |
|---------|-------|
| Card | 168 × 320px |
| Image | 168 × 220px (69%) |
| Content | 100px (31%) |
| Price | 17px / 600 |
| Title | 15px / 42px |
| Footer | 22px |
| Favourite | 40×40, no shadow |

## Legacy audit

- `r2*` classes: **none**
- `lc*` classes: **none**
- `price`/`title`/`favorite` class substrings: **none**

## Screenshots

- `card-desktop.png` / `card-mobile.png`
- `homepage-desktop.png` / `homepage-mobile.png`

**NO COMMIT · NO PUSH · Awaiting Product Owner approval**
