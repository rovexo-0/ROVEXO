# ROVEXO Addresses — Master Performance Specification

**STATUS:** APPROVED (UI/UX LOCK) · v1.0 · 2026-07-20

## Rules

- Load only the active tab’s addresses  
- Address Lookup runs only on Search Address  
- No dual lists rendered  
- Instant UI feedback on Edit sheet open/close  
- Prefer fail-closed messaging over hanging requests  

## Targets

| Action | Expectation |
|--------|-------------|
| Open Addresses | Skeleton / short load, then list |
| Switch tab | Reload that type only |
| Search Address | Network-bound; button loading state |
| Save / Delete | Optimistic message after response |

Zero performance damage vs prior Address Book: fewer permanent actions on cards; exclusive list reduces DOM.
