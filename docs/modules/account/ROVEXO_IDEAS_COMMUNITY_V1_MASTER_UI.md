# Rovexo Ideas Community v1.0 — Master UI Specification

**STATUS: OWNER APPROVED (mockups) · IMPLEMENTATION**

## Surfaces
1. Empty State — Ideas = 0
2. Community State — Ideas > 0

## Single page
Route: `/account/ideas`  
No secondary pages · No modals · Slide-down share form only

## Hero
Close X → `/account`  
Title: Rovexo **Ideas**  
CTA: **Share Your Idea**  
RX Bear hero art: `/ideas/rx-bear-hero.png`

## Empty
**Gate:** `ideas.length === 0` only (after load).  
When `ideas.length > 0` → empty unmounted (no mascot / waiting / description).  
RX Bear thinking: `/ideas/rx-bear-empty.png`  
Title: Hmm... we're waiting for your ideas!  
Description: empty body copy  
No button below bear (Share Your Idea lives in Hero)  
Show: Hero · Stats · Filters · Empty Bear · Bottom nav  
Hide (unmount): Search · Idea list · cards · votes · score · follow · share · comments · timeline

## Community
**Gate:** `ideas.length > 0`  
Stats · Filters · Expandable cards · Like/Dislike · Follow · Comments · Timeline · Share  
Empty mascot/waiting/description must not render.

## CTA label lock
Forbidden: Submit Idea · Submit Your Idea  
Required: Share Your Idea
