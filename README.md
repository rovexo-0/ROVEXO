# ROVEXO

Premium marketplace built with Next.js 16, React 19, and the ROVEXO Design System.

## Beta v1.0

This project is locked to **Beta v1.0** scope. See [ROADMAP.md](./ROADMAP.md) for module status.

**Complete:** Homepage · Search · Product Details  
**In progress:** Buyer Protection Fee  
**Planned:** Saved, Notifications, Messages, Checkout, Orders, Profile, Seller tools, Payments flows

Post-beta features (AI Scan, Voice Search, etc.) are excluded — see `lib/beta/post-beta.ts`.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

| Path | Purpose |
|------|---------|
| `app/` | Routes |
| `components/ui/` | Design system |
| `components/beta/` | Beta page shell |
| `features/` | Feature modules |
| `lib/beta/` | Beta scope registry |
| `styles/tokens.css` | Design tokens |

## Build

```bash
pnpm build
pnpm start
```
