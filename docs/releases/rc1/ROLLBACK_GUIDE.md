# ROVEXO RC1 — Rollback Guide

**Version:** `1.0.0-rc.1`

## When to rollback

- Critical checkout / payment / auth outage  
- Widespread 5xx  
- Security incident  
- Owner orders immediate revert  

## Vercel

1. Open Vercel project → Deployments  
2. Promote previous known-good Production deployment  
3. Confirm https://www.rovexo.co.uk health (login, homepage redirect, wallet/checkout if enabled)  
4. Notify Owner  

## Git

1. Do **not** force-push `main`/`master` without Owner  
2. Prefer Vercel redeploy of prior commit over destructive git history rewrite  
3. Tag rollback decision in release notes if Owner requests  

## Data

- Do not wipe production users or wallets during rollback  
- Prefer feature flags / config disable over destructive migrations  
- RC1 forbids database redesign; avoid schema roll-forward mid-incident without Owner  

## After rollback

1. Record timestamp + prior deployment URL/id  
2. File root-cause  
3. Patch as production-critical bug only  
4. Re-run validation before next deploy attempt  
