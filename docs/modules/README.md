# ROVEXO Module Documentation

Each production module has an official documentation package under `docs/modules/<module-name>/`.

See [ROVEXO Master Engineering Protocol](../ROVEXO_MASTER_ENGINEERING_PROTOCOL.md) for the mandatory lifecycle.

## Module registry

| Module | Route / entry | Phase | Certificate |
|--------|----------------|-------|-------------|
| RovexoHomePage | `/` · `components/home/RovexoHomePage.tsx` | **Frozen** | (homepage freeze — prior commit) |
| Buyer Dashboard | `/buyer` · `components/buyer/BuyerDashboard.tsx` | **Frozen** | [FREEZE_CERTIFICATE.md](./buyer-dashboard/FREEZE_CERTIFICATE.md) |

## Required files per module

- `MASTER_ENGINEERING_SPEC.md`
- `Architecture.md`
- `README.md`
- `TESTING.md`
- `CHANGELOG.md`
- `FREEZE_CERTIFICATE.md`
