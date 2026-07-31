# ROVEXO RC1 — Deployment Guide

**Version:** `1.0.0-rc.1`  
**Official origin:** https://www.rovexo.co.uk  

## Preconditions

1. RC1 freeze docs reviewed  
2. Known Issues accepted or remediated  
3. Explicit Owner authorization for commit → push → Vercel production deploy  
4. Working tree committed with RC1 version references  

## Recommended order

1. `npm run typecheck` · `npm run lint` · `npm run build` · `npm test`  
2. Commit on approved branch (message includes `1.0.0-rc.1`)  
3. Push to GitHub (Owner-authorized only)  
4. Trigger Vercel Production Deploy (Owner-authorized only)  
5. Smoke: `/` · `/login` · `/search` · `/legal` · `/help` · `/sitemap.xml` · `/manifest.webmanifest` · `/sw.js` · `/offline`  
6. Enter Phase D.2 live deployment certification  
7. Do **not** Production LOCK until D.2 + Owner acceptance PASS  

## Environment

Use production env vars only on Vercel Production. Never deploy with debug endpoints enabled.

## Forbidden

- Deploy without Owner authorization  
- Deploy with dirty unreviewed experimental branches  
- Skip smoke tests  
- Declare Production LOCK from this guide alone  
