# ROVEXO My Account — Master UI Specification

**Status:** Sprint 1 — Canonical Foundation (UI)  
**Freeze:** Pending visual QA before Sprint 2  
**SSOT:** `AccountCenterHome` (`.ac-v1`) + `styles/rovexo/account-canonical-v2.css`  
**Markers:** `data-account-version="v1.0"` · `data-account-sprint="1-foundation"`

## Route

| Route | Purpose |
|-------|---------|
| `/account` | Canonical My Account hub |

## Header

- Height **64px**
- **Back** · Profile avatar · Display name · Verified badge (if applicable)
- No page title · No notification icon

## Sections

1. Profile card — photo, name, username, member since, seller level, rating, badges, View Public Profile / Edit Profile
2. Seller Performance (compact) → `/seller/performance`
3. Empty/info cards when profile incomplete / no listings / no reviews
4. Classic outline-icon menu
5. Log Out (outlined row + confirmation)

## Menu rows (SSOT)

My Listings · Orders · Inbox · Wallet · Reviews · Saved · Following · Business tools (if verified) · Settings

Settings opens `/account/settings` only — no duplicated settings on the hub.

## Architecture

One ROVEXO Account for buy + sell. Business tools are capability-gated, not a separate account type.
