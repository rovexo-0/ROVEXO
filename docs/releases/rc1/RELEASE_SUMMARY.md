# ROVEXO RC1 — Release Summary

**ROVEXO v1.0.0 Release Candidate 1** (`1.0.0-rc.1`)

## Purpose

Freeze the certified v1.0 codebase for the first public deployment candidate. Stabilize only — no new marketplace features, UI redesign, architectural refactoring, experimental code, or database redesign.

## Freeze

All modules listed in `lib/release/rovexo-v1-rc1-freeze-v1.ts` are structurally frozen. Post-RC1 work is **v1.1** unless production-critical.

## Version alignment

| Surface | Value |
|---------|-------|
| Package | `1.0.0-rc.1` |
| `lib/app/version.ts` | `1.0.0-rc.1` / RC1 |
| Manifest description | includes `RC1 1.0.0-rc.1` |
| Service Worker cache | `rovexo-static-v15` |

## Gate posture

- GitHub Push: **NOT AUTHORIZED**
- Vercel Production Deploy: **NOT AUTHORIZED**
- Production LOCK: **NOT AUTHORIZED**

## Next

1. Owner reviews RC1 docs + Known Issues  
2. Owner authorizes commit / push / deploy  
3. Phase D.2 post-deploy certification  
4. Owner Production LOCK only if every critical gate PASS  
