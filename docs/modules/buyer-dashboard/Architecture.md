# Buyer Dashboard — Architecture

## Overview

The Buyer Dashboard is a server-rendered Next.js page with a client composition tree. Data is fetched once on the server and passed into a React context provider for section components.

## Layer diagram

```mermaid
flowchart TB
  subgraph server [Server]
    Page["app/buyer/page.tsx"]
    Queries["lib/buyer/queries.ts"]
    Repo["lib/buyer/repository.ts"]
  end

  subgraph client [Client]
    Provider["BuyerDashboardProvider"]
    Dashboard["BuyerDashboard"]
    Sections["Section components"]
  end

  subgraph domain [Domain libs]
    Orders["lib/orders/queries"]
    Saved["lib/saved/store"]
    Recent["lib/launch/recently-viewed"]
    Addr["lib/addresses/repository"]
    Msg["lib/messages/store"]
    Notif["lib/notifications/store"]
    Trust["lib/trust/service"]
  end

  Page --> Queries --> Repo
  Repo --> Orders & Saved & Recent & Addr & Msg & Notif & Trust
  Page --> Provider --> Dashboard --> Sections
  Sections --> Provider
```

## Key types

`types/buyer/dashboard.ts` defines `BuyerDashboardData` — the aggregate DTO consumed by all sections.

## Repository responsibilities

`fetchBuyerDashboardRepository(profile)`:

1. Parallel-fetch trust, orders, saved items, recently viewed, addresses, conversations, notifications
2. Derive statistics, protection summary, reviews summary
3. Build quick-action config from constants
4. Return unified `BuyerDashboardData`

## Hooks

`hooks/buyer/BuyerDashboardProvider.tsx` exposes `useBuyerDashboard()` — read-only context for section components.

## Lazy loading

`BuyerDashboard.tsx` dynamically imports sections below the fold (order history through support) with skeleton fallbacks.

## Error boundary

`app/buyer/error.tsx` renders `BuyerErrorState` with retry via Next.js error boundary reset.

## Styling

`styles/rovexo-buyer-dashboard.css` — module-scoped BEM-style classes with CSS custom properties for tokens. Does not import or modify `rovexo-homepage.css`.

## Extension points (future)

| Feature | Prepared via |
|---------|----------------|
| Theme engine | CSS variables on `.buyer-page` |
| Glass icons | `RovexoIcon` + `IconTheme.mode` |
| Wallet | Quick-action href + payments section |
| AI assistant | Support section link to `/assistant` |
| Stripe | `BuyerPayments` placeholder cards |

## Forbidden patterns

- Direct `createClient()` in `components/buyer/*`
- Duplicate listing card implementations
- Alternate dashboard entry components
- Modifications to `components/home/RovexoHomePage.tsx`
