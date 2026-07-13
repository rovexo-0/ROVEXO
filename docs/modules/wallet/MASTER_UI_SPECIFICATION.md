# ROVEXO Wallet — Master UI Specification

**Route:** `/wallet`  
**Canonical component:** `features/wallet/components/WalletHubV1.tsx`  
**Canonical styles:** `styles/rovexo/wallet-hub-v1.css`  
**Visual SSOT:** `docs/modules/wallet/wallet-v1-canonical-mockup.png`  
**Status:** `Implemented — awaiting pixel-perfect visual QA`  
**Freeze:** Blocked until explicit visual QA approval

## Final dimension lock

| Token | Value |
|-------|-------|
| Header height | 64px |
| Header pad | 20px |
| Back / Help | 40×40 |
| Content pad-x | 20px (24px ≥640px) |
| Hero margin-top | 20px |
| Hero height | 170px |
| Hero radius | 24px |
| Hero pad | 24px |
| Hero buttons | 52px H · 14px radius · equal width |
| Metrics gap | 16px |
| Metric card | 128px H · 18px radius · 20px pad |
| Quick top | 28px |
| Quick card | 92px H · 16px radius · 12px gap |
| Insight card | 118px H · 18px radius |
| Bank card | min 108px · 18px radius |
| Max-width mobile | 390px |
| Max-width desktop | 720px |

Desktop may change only max-width, columns, horizontal spacing.
