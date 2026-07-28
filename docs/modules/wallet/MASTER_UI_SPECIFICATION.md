# ROVEXO Balance / Wallet — Master UI Specification

**Route:** `/wallet` (canonical Wallet hub · Blood XIII)  
**Canonical visible name:** **Balance**  
**Status:** REVIEW — Sprint IV IN DEVELOPMENT (Blood XIII + **Blood XIV Development Freeze Law**)  
**Markers:** `data-blood-code-xiii="13.0"` · `data-blood-code-xiv="14.0"` · `data-wallet-sprint="IV"` · `data-wallet-freeze="IN-DEVELOPMENT"` · `data-wallet-hub-version="v1.0-canonical"`

## Absolute rules

```
PROFILE = MASTER DESIGN SYSTEM
Balance inherits Profile shell / Full Width / Compact Premium.
ONLY financial components may differ (purple Available card + status cards).
LIVE MONEY ONLY — no hardcoded £ amounts.
width: 100%; max-width: none;
ONE ENTRY POINT = /wallet (Blood XIV)
Forbidden hubs: /balance · /wallet-v2 · /wallet-new · /wallet-redesign · /wallet-beta · /wallet-test
Legacy /balance → redirects to /wallet
```

## Header

Allowed: Back · **Balance** · Help  
Forbidden: Search Bar · Marketplace header · ROVEXO logo

## Bottom navigation

Home · Search · Sell · Inbox · Account — always visible

## Withdraw button (Owner lock)

| Token | Value |
|-------|-------|
| height | 44px |
| min-width | 140px |
| border-radius | 16px |
| font-size | 14px |
| font-weight | 600 |
| Forbidden | 56px · full width · giant · sharp corners |

## Available card states

| State | Withdraw | Hint |
|-------|----------|------|
| available | enabled | Available to withdraw |
| zero | disabled | Available to withdraw |
| processing | disabled | Bank Processing |
| locked | disabled | Security Lock |

## Structure

1. Header — Profile shell · **Balance** · Help  
2. Available Balance — purple premium card + Withdraw · Bank Account  
3. Pending · Available · Processing · Paid Out metrics  
4. Quick Actions · Insights · Connected Bank · Transactions  

## Required Sprint IV surfaces (via hub + `/wallet/*`)

Wallet Balance · Transaction History · Withdraw · Bank Account · Pending / Completed / Refund transactions · Payout History · Platform Fee transactions · Responsive mobile

## Preview

`http://localhost:3000/wallet`

No permanent freeze / commit / push / deploy until Owner certification.
