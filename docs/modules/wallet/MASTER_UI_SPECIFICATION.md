# ROVEXO Wallet — Master UI Specification

**Route:** `/wallet`  
**Canonical:** `WalletHubV1` + `styles/rovexo/wallet-hub-v1.css`  
**Version:** v1.1 simplified UI  
**Status:** Implemented — `data-wallet-ui="v1.1-simplified"` · `data-wallet-freeze="pending-visual-qa"`  
**Freeze:** Only after explicit pixel-perfect visual QA approval

## Locked tokens (v1.1)

| Token | Value |
|-------|-------|
| Header | 64px · pad 20 · controls 40×40 · title 32/700 · no shadow |
| Page | bg `#FFFFFF` · pad 20 / 20 / 32 · max-width 430px (480 desktop) |
| Hero | 170×24 radius · pad 24 · full-width equal Withdraw / Bank Account 52×14 |
| Balance list | ONE card · radius 20 · pad 20 · four 60px rows · outline icons 24 · chevron 20 |
| Quick Actions | ONE card · 108×20 · four equal columns · outline icons |
| Insights | View all · two cards 118×18 |
| Connected Bank | compact 96px row · inline Connect CTA · outline bank icon |
| Desktop | same UI · wider max-width only |

## Hard rules

- No 2×2 Pending / Available / Processing / Paid Out metric cards
- No coloured icon circles / backgrounds on hub actions
- Do not change APIs, wallet logic, withdraw, bank, payment methods, or routing
