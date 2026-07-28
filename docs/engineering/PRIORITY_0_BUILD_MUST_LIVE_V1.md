# ROVEXO Priority 0 — Build Must Live

| Field | Value |
|-------|-------|
| STATUS | **OWNER APPROVED · PERMANENT FREEZE · NEVER REMOVE** |
| Approved | 2026-07-23 |
| SSOT | `lib/priority-0-build-must-live-v1.ts` |
| Parent | Priority 0 Absolute Law |

## Absolute law

If BUILD / CSS / TAILWIND / LAYOUT / PREVIEW fails → **the product does not exist.**

## Phase 1

1. Build fix  
2. `styles/rovexo/index.css`  
3. Tailwind validation  
4. PostCSS validation  
5. Global CSS validation  
6. Root layout validation  
7. Import validation  
8. Preview validation  
9. **BUILD PASS**

## Required commands

- `npm run build` → PASS  
- `npm run typecheck` → PASS  
- `npm run lint` → PASS  
- Local preview → PASS  
- Owner preview → PASS  

## Entrypoints

- `styles/rovexo/index.css`  
- `app/globals.css` (`@import "tailwindcss"`)  
- `app/layout.tsx` (imports design system + globals)  
- `postcss.config.mjs` (`@tailwindcss/postcss`)  

## Sprinters blocked until

BUILD + CSS + PREVIEW + WHITE SCREEN + OWNER CERTIFICATION = PASS → then Sprint 2 may unlock.
