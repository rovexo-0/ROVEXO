# ROVEXO Priority 0 — Absolute Law

| Field | Value |
|-------|-------|
| STATUS | **OWNER APPROVED · PERMANENT FREEZE · NOTHING COMES BEFORE** |
| Approved | 2026-07-23 |
| SSOT | `lib/priority-0-v1.ts` |
| Cursor rule | `.cursor/rules/priority-0-v1.mdc` |
| Surfaces | White Screen · Preview View · Conversation Hub |

## Nothing comes before

White Screen + Preview View + Conversation Hub.

## Owner fail → blocks

Product FAIL · Sprint FAIL · Commit BLOCKED · Push BLOCKED · Certification BLOCKED

Triggers: white/empty/black/null/broken screen · no image · no button · no price · no Pay Now · no messages · no header · no responsive view.

## Validation pipeline

Data → API → Auth → Imports → Routes → Component → Page → Mobile → Responsive → Image → Button → Preview → Owner visual → Zero regression → Self recovery → Certification

## Fail closed

Never: white / empty / black / null.  
Only: Loading Skeleton · Temporary · Error · Self Recovery · Refresh · Diagnostic.

## Preview Owner must see

Header · Back · Image · Title · Price · Pay Now · Status · Labels · Messages · Input · Buttons · Timeline · Scroll · Responsive (mobile/tablet/desktop) · Animations · Tracking · Notifications · Automations

## Conversation Hub never

White screen · broken component · null data · missing image/price/buttons · broken Pay Now

## Self recovery

| Fail | Show |
|------|------|
| API | Loading Skeleton |
| Image | Placeholder Image |
| Payment | Temporary Message |
| Import | Error Component |
| Data / Component | Self Recovery |

## Owner law

If Owner cannot SEE + SCROLL + CLICK + BUY + SELL + PAY + TRACK + TEST → **the product does not exist.**

## Priority 0 order

1. Fix white screen  
2. Fix preview  
3. Fix Conversation Hub  
4. Fix responsive  
5. Fix Pay Now  
6. Fix images  
7. Fix messages  
8. Visual certification  
9. Zero regression testing  
10. **Sprint 2 unlocked**

Official preview: `https://preview.rovexo.co.uk/inbox` · Local: `http://localhost:3010/inbox`
