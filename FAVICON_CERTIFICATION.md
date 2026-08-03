# ROVEXO Favicon / App Icon Certification

**Date:** 2026-08-03  
**Status:** PASS  
**Favicon source:** Owner-approved **RX only** (no hands)  
**Auth freeze:** UNTOUCHED  
**Release:** ❌ NO COMMIT · ❌ NO PUSH · ❌ NO DEPLOY  

## Verdict

| Gate | Result |
|------|--------|
| Source = Owner RX logo without hands | **PASS** |
| Hands version NOT used | **PASS** |
| Browser tab / PWA / Apple / Android from same RX | **PASS** |
| Authentication unchanged | **PASS** |

## Source

Owner plate → crop RX monogram (exclude hands + tagline) → transparent → square.

Canonical file: `public/brand/canonical-rx/rx-favicon-source-v1.png`  
Generator: `node scripts/generate-favicon-from-rx-only.mjs`

## Generated (requested)

| Asset | Path |
|-------|------|
| favicon.ico | `public/favicon.ico` · `app/favicon.ico` |
| icon-16.png … icon-512.png | `public/icons/icon-{16,32,48,64,128,192,256,512}.png` |
| apple-touch-icon.png | `public/apple-touch-icon.png` |
| maskable-icon-512.png | `public/icons/maskable-icon-512.png` |
| icon-maskable-512.png | `public/icons/icon-maskable-512.png` (SSOT alias) |

## Browser cache warning

Hard refresh / clear site data / remove & re-add Home Screen shortcuts — favicons cache aggressively.

## Technical gates

| Command | Result |
|---------|--------|
| RX-only generator | **PASS** |
| Prior typecheck / lint / build | **PASS** (previous run) |
