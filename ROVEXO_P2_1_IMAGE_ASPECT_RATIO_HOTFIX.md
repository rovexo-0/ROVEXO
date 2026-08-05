# ROVEXO HOTFIX P2.1 — Next Image Aspect Ratio Warning
**STATUS:** COMPLETE (awaiting Owner approval — no commit/push/deploy)  
**DATE:** 2026-08-04  
**SCOPE:** Console warning only · zero visual/functional change

---

## 1. Root cause

Canonical header renders Level III App Icon via `SafeImage` → `next/image`:

**File:** `components/header/RovexoHeaderV2.tsx`

| | Value |
|--|--------|
| Image props (before) | `width={42}` · `height={28}` → HTML attrs `width="42"` `height="28"` |
| CSS (unchanged) | `.rx-h2__logo-img { height: 28px; width: auto; max-height: 28px; max-width: 42px; }` |
| Asset | Square `app-icon-v1.png` |

Next.js runtime check (`image-component.js`):

```
heightModified = renderedHeight !== attr("height")
widthModified  = renderedWidth  !== attr("width")
warn if XOR(heightModified, widthModified)
```

With CSS `height: 28` + `width: auto` on a **square** icon → painted size **28×28**.

- height: `28 === "28"` → **not** modified  
- width: `28 !== "42"` → **modified**  
→ **XOR true → warning**

CSS already had `width: auto` (Law XXXIX). The mismatch was the **non-square width={42} prop** left from a wider-mark era, not missing CSS.

---

## 2. File(s) modified

- `components/header/RovexoHeaderV2.tsx` only  
- CSS **not** changed (already correct)  
- Asset **not** changed

---

## 3. Exact line(s) changed

```tsx
// BEFORE
width={42}
height={28}

// AFTER
width={28}
height={28}
```

Aligns Image intrinsic props with certified **28px** Homepage App Icon scale (`HOMEPAGE_HEADER_APP_ICON_CERTIFIED_HEIGHT_PX = 28`) and square asset.

---

## 4. Before

- Console: `Image "...app-icon-v1.png" has either width or height modified, but not the other.`
- Painted: 28×28 (CSS)
- Attrs: 42×28

## 5. After

- Console: no aspect-ratio warning for this image (attrs 28×28 match paint)
- Painted: still 28×28 via same CSS
- Layout/spacing/header: unchanged

---

## 6. Screenshot comparison

Automated Playwright screenshot blocked in this environment (browser libs / automation gate).  
Visual expectation: **identical** — CSS size unchanged; only HTML `width`/`height` attributes corrected from `42×28` → `28×28`.

Owner: confirm on `http://localhost:3000/` (authenticated Homepage header) that RX mark looks unchanged.

**Static XOR proof** (same check Next.js uses in `image-component.js`):

| | attrs | painted (CSS 28×auto, square PNG) | heightModified | widthModified | warn |
|--|-------|-----------------------------------|----------------|---------------|------|
| Before | 42×28 | 28×28 | false | **true** | **YES** |
| After | 28×28 | 28×28 | false | false | **NO** |

## 7. Runtime verification

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint (touched file) | **PASS** |
| Brand freeze tests (5 files / 33) | **PASS** |
| CSS `.rx-h2__logo-img` height 28 / width auto | **Unchanged** |
| Other `app-icon` call sites audited | No other 42×28 mismatch |
| Playwright multi-browser matrix | **Not run here** (env gate) — Owner device check |

Production build: not re-run for one-prop change; TypeScript + brand locks PASS. Owner may request full build before commit.

## 8. Console verification

Warning fires only when exactly one of width/height differs from the HTML attribute. After fix both attrs are `28` and CSS paints `28×28` → both unmodified → **warning eliminated** (static proof above).
---

## PASS / FAIL

### **PASS**

No commit / push / merge / deploy without Owner approval.
