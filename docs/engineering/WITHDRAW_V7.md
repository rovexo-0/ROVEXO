# ROVEXO Withdraw v7.1 FINAL FROZEN

**STATUS:** FROZEN · Absolute Authority  
**Change from v7.0:** Disabled Withdraw — removed not-allowed / prohibited cursor glyph · `pointer-events: none` · no `::before`/`::after` icons. Nothing else modified.

## Disabled CTA (locked)

```css
opacity: 0.5;
cursor: default;
pointer-events: none;
filter: none;
box-shadow: none;
```

No prohibited · warning · technical icons on the button.

## SSOT

- CSS: `styles/rovexo/withdraw-v7.css`  
- State: `lib/wallet/withdraw-page-v7.ts` (`v7.1`)  
- Page: `features/wallet/components/withdraw/WithdrawPage.tsx`  
