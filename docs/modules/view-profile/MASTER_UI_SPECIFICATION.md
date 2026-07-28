# ROVEXO View Profile — Master UI Specification

| Field | Value |
|---|---|
| **Module** | View Profile v1.0 |
| **Route** | `/user/[username]` |
| **Status** | APPROVED (Owner canonical message — 2026-07-20) |
| **Canonical UI** | `features/profile/components/ViewProfilePage.tsx` |
| **Styles** | `styles/rovexo/view-profile-v1.css` |

## Scope

UI/UX only. Followers, reviews, listings, ratings, auth, DB, APIs unchanged.

## Structure

1. Header: Back · `@username` · `···` menu  
2. Hero: optional cover · avatar · name · rating · followers · following · Follow (others)  
3. Tabs only: Listings · Reviews · About  
4. Listings: Active / Sold · two-column `ListingCard` grid  
5. Reviews: avg · filters All / Members / Automatic · stars · text · date · name  
6. About: verified flags · country · member since · last seen (if available) · follower/following counts  

## Menu

- Own: Share · Edit profile · Profile settings · Close  
- Other: Share · Report user · Block user · Close  

## Design

White background · purple accent `#9333ea` · gold stars · mobile-first · no clutter.
