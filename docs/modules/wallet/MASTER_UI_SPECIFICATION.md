# ROVEXO Wallet — Master UI Specification

**Route:** `/wallet`  
**Canonical:** `WalletHubV1` + `styles/rovexo/wallet-hub-v1.css`  
**Version:** v1.2 simplified UI  
**Status:** Implemented — `data-wallet-ui="v1.2-simplified"` · `data-wallet-freeze="pending-visual-qa"`  
**Freeze:** Only after explicit pixel-perfect visual QA approval

## Universal UI v1.1 compatibility amendment

Approved 2026-07-15. Wallet APIs, payout logic and routing are unchanged. Presentation now consumes Universal UI v1.1: 60px header, 44px controls, 24px icons, 48px hero actions, 14px radii, no card shadows, 16px horizontal padding, 24px section rhythm, 14px body text and 16px section titles.

## Locked tokens (v1.2)

| Token | Value |
|-------|-------|
| Header | 64px · pad 20 · controls 40×40 · title 32/700 · no shadow |
| Page | bg `#FFFFFF` · pad 20 / 20 / 32 · max-width 430px (480 desktop) |
| Hero | Only wallet summary · 170×24 radius · pad 24 · Withdraw / Bank Account 52×14 |
| Quick Actions | No title · ONE card · 108px · four equal columns · 24px below hero |
| Insights | View all · two cards 118×18 · 24px gaps |
| Connected Bank | No title · compact 96px row · inline Connect CTA |
| Transactions | Keep title + View all |
| Desktop | same UI · wider max-width only |

## Removed in v1.2

- Balance list (Pending / Available / Processing / Paid Out)
- Section titles: Quick Actions, Connected Bank

## Hard rules

- Hero is the only balance summary
- Do not change APIs, wallet logic, withdraw, bank, payment methods, or routing
