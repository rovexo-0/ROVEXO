# ROVEXO Sell — FAILED UI Polish Audit (Root Cause)

**STATUS:** INVESTIGATION COMPLETE (code + import proof) · **SCREENSHOT GATE BLOCKED**  
**Route:** `http://localhost:3000/sell`  
**Date:** 2026-08-01  
**Commit / push / deploy:** NONE (forbidden)

---

## Verdict (binary)

| Hypothesis | Result |
|---|---|
| **A** Modified components are NOT the ones rendered by `/sell` | **FAIL (false)** — they ARE rendered |
| **B** `sell.css` is not applied | **FAIL (false)** — imported via global chain |
| **C** Canonical Sell imports different components | **FAIL (false)** — same files |
| **D** Duplicate / legacy Sell Pricing·Quantity·OptionPicker·Parcel | **FAIL (false)** for those four — **one each** under `features/sell/ui/` |
| **Root cause of “almost nothing visible”** | **PASS (identified)** — see §5 |

**Overall UI Polish Phase 1 visibility audit:** **FAIL** (Owner visual observation stands; polish deltas are gated and/or visually near-zero; £ adornment is code-present but not Owner-verified on localhost screenshots).

---

## 1. Canonical component tree (`/sell`)

**Proven from:**

- `app/(platform)/sell/page.tsx` → `<SellPage />`
- `features/sell/ui/SellPage.tsx` JSX order

```
app/(platform)/sell/page.tsx
└─ SellPage (features/sell/ui/SellPage.tsx)
   └─ SellProvider
      └─ SellPageInner
         └─ AccountCanonicalShell (dataMyAccountSurface="sell")
            └─ [data-sell-shell] .sell-compact-premium
               └─ AccountPageStack
                  ├─ SellPhotoRail
                  ├─ SellTitleBlock
                  ├─ SellDescriptionBlock
                  ├─ SellCategoryBlock
                  │  └─ SellCategoryPicker   ← Category search (NOT SellOptionPicker)
                  ├─ SellProgressiveAttributes   ← null until categoryPath set
                  │  ├─ SellNavRow | CanonicalInput (per attribute)
                  │  └─ SellOptionPicker (when a select attribute is opened)
                  ├─ SellPricingBlock
                  ├─ SellStockQuantityBlock
                  ├─ SellParcelBlock
                  │  └─ ParcelPicker (internal function in same file)
                  └─ SellPublishBar
```

**Related routes (not parallel Pricing UI):**

| Route | Behaviour |
|---|---|
| `/sell` | Canonical create Sell |
| `/sell/new` | `redirect("/sell")` only |
| `/sell/camera` | Camera helper (out of polish scope) |
| `/sell/auction` | Auction surface (out of polish scope) |

---

## 2. Modified files — USED vs NOT USED

| File | Used by `/sell`? | Who renders |
|---|---|---|
| `features/sell/ui/SellPricingBlock.tsx` | **USED** | `SellPage` → `#sell-field-price` |
| `features/sell/ui/SellStockQuantityBlock.tsx` | **USED** | `SellPage` → `#sell-field-stock` |
| `features/sell/ui/SellOptionPicker.tsx` | **USED** | Only via `SellProgressiveAttributes` when an attribute row is opened |
| `features/sell/ui/SellParcelBlock.tsx` | **USED** | `SellPage` → `#sell-field-parcel` (+ internal `ParcelPicker`) |
| `styles/rovexo/sell.css` | **USED** | Global CSS — see §4 |
| `lib/sell/attribute-engine.ts` (`Compatible With`) | **USED** | Label on Compatibility attribute when taxonomy includes it (often **text** `CanonicalInput`, not picker) |

**NOT the wrong-file problem.** Canonical `/sell` already mounts these files.

---

## 3. Duplicate component audit

| Surface | Canonical | Legacy / unused / duplicate |
|---|---|---|
| Pricing | `SellPricingBlock.tsx` only | No second Sell pricing block under `features/sell` / `components/sell` |
| Quantity | `SellStockQuantityBlock.tsx` only | Dead CSS `.sell-stock-stepper*` removed in polish diff; no Quantity page route |
| Option picker (Brand / Material / Condition / Colour …) | `SellOptionPicker.tsx` via `SellProgressiveAttributes` | **Category** uses separate `SellCategoryPicker.tsx` (different search implementation — raw `<input className="cds-input">`) |
| Parcel | `SellParcelBlock.tsx` + internal `ParcelPicker` | No second Parcel Size UI for Sell |
| Brand / Material / Condition pickers | Same `SellOptionPicker` | No dedicated `BrandPicker.tsx` / `MaterialPicker.tsx` |
| Search input (attributes) | `SellOptionPicker` → `CanonicalInput` (polish target) | Category search remains unpolished in `SellCategoryPicker` |

---

## 4. CSS import audit

**Import chain (exact):**

```
app/(platform)/layout.tsx
  → import "@/styles/rovexo/index.css"
    → styles/rovexo/index.css
      → @import "./sell.css";   (line ~116, near end of sheet)
```

**Overrides that matter:**

- Sell shell tokens under `[data-sell-shell]` (control height 52px, field gap 4px).
- Input height/padding rules earlier in `sell.css` do **not** wipe `padding-left`; later rule  
  `[data-sell-shell] .sell-price-currency .cds-input { padding-left: 28px; }` is intended to reserve space for `£`.
- Parcel polish mostly remaps `#9333ea` → `var(--cds-color-primary, #9333ea)` — **same visible colour**.

**Conclusion:** CSS file is loaded. “Not imported” is **ruled out**.

---

## 5. Root cause (proven)

Wrong-component / missing-CSS / duplicate-Pricing hypotheses are **eliminated**.

**Real root cause (compound):**

### RC-1 — Polish is gated off the default empty Sell screen

| Polish | Visible when |
|---|---|
| Brand / Material / Condition picker polish | Category selected **and** attribute row opened → `SellOptionPicker` |
| Search polish (`CanonicalInput` in picker) | Same — only inside open attribute picker |
| `Compatible With` label | Category whose taxonomy includes `compatibility` |
| Category search polish | **Never targeted** — lives in `SellCategoryPicker`, not `SellOptionPicker` |

Empty `/sell` (no category) shows Photos → Title → Description → Category → Price → Quantity → Parcel. Attribute polish is **invisible by design**.

### RC-2 — Several shipped deltas are visually near-zero

| Change | Why Owner may see “unchanged” |
|---|---|
| Parcel colour tokens | Fallback hex identical to previous `#9333ea` |
| Option picker gap `ds-2` → `ds-1`, section title class | Subtle density; only in open modal |
| Quantity icon `price`/`wallet` → `quantity`/`inventory` | Real code change; easy to miss if icons similar / not scrolled to |
| Price `£` adornment | **In source + CSS**; should be obvious if CSS paints — **needs localhost screenshot proof** (blocked here) |

### RC-3 — Owner-visible “tiny Parcel change” matches RC-2

Parcel is always on the form and was lightly retokenized → matches Owner report of **only a small Parcel visual change**.

---

## 6. Per-item PASS / FAIL (Owner visibility on default `/sell`)

| Item | Code wired to canonical? | Owner-visible on default `/sell`? | Verdict |
|---|---|---|---|
| Price £ | YES (`SellPricingBlock` + CSS) | Unproven (screenshots blocked) | **FAIL** (visibility audit) |
| Quantity icon | YES (`fieldId="quantity"` + icon map) | Unproven / likely subtle | **FAIL** |
| Brand picker | YES (`SellOptionPicker`) | Gated (category + open) | **FAIL** |
| Material picker | YES | Gated | **FAIL** |
| Condition picker | YES | Gated | **FAIL** |
| Compatibility label | YES (`Compatible With`) | Gated (taxonomy) | **FAIL** |
| Parcel polish | YES | Subtle token remap | **PARTIAL** |
| Search polish | YES on `SellOptionPicker` only | Gated; Category search untouched | **FAIL** |

---

## 7. Screenshot / localhost proof status

**REQUIRED by Owner:** Before/After screenshots on localhost.

| Attempt | Result |
|---|---|
| Playwright Linux Chromium | FAIL — missing `libnspr4.so` / `libnss3.so` / `libasound.so.2` |
| Windows Chrome via Playwright | FAIL — remote debugging pipe (WSL) |
| Host package install for libs | **Skipped by Owner/system** |
| cursor-ide-browser MCP | Tools unavailable in this session |
| Unauthenticated `curl /sell` | 307 → `/login?next=%2Fsell` |

Evidence log: `docs/modules/sell/failed-polish-audit-evidence/run.log`  
**No PNG before/after captured.** Task 5 = **INCOMPLETE**.

---

## 8. Correct implementation plan (AFTER Owner accepts root cause)

Do **not** polish again until Owner unlocks. When unlocked:

1. **Stay on the one tree** — only `SellPage` → listed blocks. Do not create `*_v2`.
2. **Make Price £ fail-closed visible** — verify computed style on `#sell-field-price .sell-price-currency__symbol`; if clipped/zero opacity, fix **only** adornment CSS/DOM inside `SellPricingBlock` + `sell.css`.
3. **Quantity** — keep `fieldId="quantity"`; ensure inventory glyph is clearly distinct from wallet (still Master Icon SSOT).
4. **Attribute picker polish** — keep `SellOptionPicker`; if Owner also meant Category search, polish **`SellCategoryPicker`** search (same presentation intent) — that is the surface users open first.
5. **Compatibility** — label already `Compatible With`; verify on a Vehicle Parts (or other) leaf that includes `compatibility`.
6. **Parcel** — only if Owner wants a *visible* polish beyond token aliasing; otherwise leave.
7. **Remove dead code only after proof** — no duplicate Pricing/Quantity files found to delete.
8. Re-run localhost screenshots (Owner browser or approved Chromium deps) before any commit.

---

## 9. Forbidden (still in force)

No redesign · no Attribute Engine logic changes beyond already-applied label · no Publish/Validation/DB/API/Shipping · no commit · no push · no deploy.
