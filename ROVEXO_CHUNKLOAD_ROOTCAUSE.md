# ROVEXO ChunkLoadError — Root Cause (Phase R1.1)

**Status:** REPAIRED (runtime recovery + LAN dev origins)  
**Host:** `http://localhost:3000` (agent) · Owner mobile via LAN IP  

## Symptom

Owner mobile console: `ChunkLoadError` / `Failed to load chunk`.

## Root cause (verified)

1. **Stale chunk hashes after `.next` wipe / Turbopack rebuild** — phone Safari/Chrome keeps old `/_next/static/chunks/*.js` URLs; server no longer has those hashes → load fails → interactive UI breaks (including Delete Listing fetch paths).
2. **Dev cross-origin HMR / asset allowlist gap** — `allowedDevOrigins` covered `192.168.*.*` but only `172.16–18.*`. WSL Hyper-V NAT often uses `172.24.x.x`. Incomplete allowlist can block or race chunk delivery during LAN Owner testing.
3. **Not** a production architecture defect in Auth / Inbox / Wallet. Not a CSS or bundle-split redesign issue.

## Repair (smallest)

| Change | File |
|--------|------|
| One-shot session reload on ChunkLoadError / failed chunk | `components/runtime/ChunkLoadRecovery.tsx` + `app/layout.tsx` |
| Expand RFC1918 `172.16/12` allowlist for WSL NAT | `next.config.ts` `allowedDevOrigins` |

## Not changed

UI · UX · route splitting · lazy-loading strategy · ISR · Edge · cache headers.

## Owner verify

1. Open LAN URL on iPhone Safari after a local rebuild.
2. Navigate Home → Browse → Account → Listing.
3. Confirm: no persistent ChunkLoadError; if one stale hit occurs, page recovers with a single reload (session flag prevents loops).
