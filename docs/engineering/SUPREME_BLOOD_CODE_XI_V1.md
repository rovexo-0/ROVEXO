# ROVEXO Supreme Blood Code XI — Development Freeze Law

| Field | Value |
|-------|-------|
| STATUS | **APPROVED · PERMANENT LAW** |
| Approved | 2026-07-23 |
| SSOT | `lib/supreme-blood-code-xi-v1.ts` |
| Rule | `.cursor/rules/supreme-blood-code-xi-v1.mdc` |

## Golden law

- One sprint = one module  
- One feature = one entry point  
- One module = one implementation = one freeze = one certification  
- No duplicates  

## Sprint map

| Sprint | Module | Route | Status |
|--------|--------|-------|--------|
| I | Inbox | `/inbox` | LOCKED |
| II | Conversation Hub | `/inbox/conversation` | LOCKED |
| III | Orders | `/orders` | **LOCKED · 100% COMPLETE** |
| IV | Wallet | `/wallet` | **IN DEVELOPMENT** (Blood XIII) |
| V | Sell | `/sell` | PENDING |
| VI | Checkout | `/checkout` | PENDING |
| VII | Account | `/account` | PENDING |

## Current

Sprint IV Wallet — **IN DEVELOPMENT** (Blood XIII APPROVED TO START).  
Official: `http://localhost:3000/wallet`  
Sprint I–III remain LOCKED.

## Search Bar Law

Allowed only on `/`. Elsewhere: UNMOUNTED (not CSS-hidden).  
SSOT: `lib/header/homepage-search-bar-only-v1.ts`

## Localhost

Official: `http://localhost:3000`

## Gates

TypeScript · ESLint · Build · Responsive · QA · localhost · Mobile · Production — all PASS required.
