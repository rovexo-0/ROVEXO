# Wallet — Master Design System Contract v4.0

**STATUS:** REVIEW (awaiting Owner visual approval)  
**Master:** Profile / Settings Design System  
**Children:** Balance · Transactions · Payment Methods · Bank Accounts

## Official previews

- Balance: `http://localhost:3010/wallet`
- Transactions: `http://localhost:3010/wallet/transactions`
- Payment Methods: `http://localhost:3010/wallet/payment-methods`
- Bank Accounts: `http://localhost:3010/wallet/bank-accounts`

## Inheritance (mandatory)

| Token | Value |
|-------|--------|
| Shell | `AccountCanonicalShell` + Full Width Engine |
| Rows | `CanonicalMenuRow` |
| Icons | Profile Icon System v1.0 · 24px · `WalletProfileChrome` / `RvxLineIcons` |
| Help | `WalletHelpHeaderAction` → Profile help icon |
| Fail-closed | `FailClosedPanel` / `FAIL_CLOSED_USER_MESSAGE` — never technical errors |
| Markers | `data-design-master="profile"` · `data-profile-master="v7.0"` · `data-icon-system="profile-v1.0"` |

## Authorized exception

Purple **Available Balance** card on `/wallet` remains the Owner-authorized financial component. All other Wallet chrome inherits Profile.

## What changed

- Balance status rows → CanonicalMenuRow + Profile icons
- Payment Methods v4.1 → CanonicalMenuRow; removed `pm-v4` parallel DS
- Bank Accounts v5.1 → CanonicalMenuRow; removed `ba-v5` parallel DS
- Wallet loading/error shells → AccountCanonicalShell + FailClosedPanel
- Child route `error.tsx` for payments, banks, transactions, pending, processing, locked

## What did not change

- Stripe / Connect / UK bank APIs / escrow money movement
- No commit / push / deploy

## Remaining debt (honest)

- Statements still use legacy `.wallet-hub*` styles
- Orphan `.wallet-v2*` CSS still in bundle (quarantined in comments)
- Playwright / Lighthouse / Production Absolute Authority: not claimed PASS until executed
