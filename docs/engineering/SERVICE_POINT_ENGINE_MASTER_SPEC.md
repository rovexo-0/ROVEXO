# ROVEXO SERVICE POINT ENGINE — MASTER SPEC

**STATUS:** Gate 0 FREEZE · FAIL CLOSED  
**SSOT:** `lib/shipping/service-point-engine-v1.ts`  
**Flag:** `SERVICE_POINT_ENGINE_ENABLED` (default **false**)

## Mission

Service Points (collection / parcel shop drop-off & pickup) must never activate until Sendcloud Service Point API integration is certified.

## Gates

| Gate | Name | Outcome |
|------|------|---------|
| **Gate 0** | Freeze / fail-closed | Engine disabled. No SP picker · persistence · parcel SP fields. Routes return **503** with `feature: service_points`, `status: disabled`. |
| **Gate 1** | Sendcloud SP API read | List service points for postcode / location — certified sandbox. |
| **Gate 2** | Selection persistence | Buyer/seller can select SP id on checkout / label flow — DB contract. |
| **Gate 3** | Label + SP binding | Shipping label creation includes certified SP payload. |
| **Gate 4** | Checkout UX | Collection Point UI on Checkout — only when flag ON + Gate 3 PASS. |
| **Gate 5** | Production certification | End-to-end SP on localhost:3000 + Owner visual + zero regression → enable `SERVICE_POINT_ENGINE_ENABLED=1` in production. |

## Gate 0 contract (live)

- `isServicePointEngineEnabled()` → false unless env is `1` or `true`
- `servicePointEngineDisabledResponse()` → HTTP 503
- Reason: `Sendcloud API integration not certified`
- Checkout Collection Point capability remains hidden while Gate 0 is closed

## Forbidden until Gate 5

- Soft-enable via UI without flag
- Parallel Service Point systems
- Storing SP ids while Gate 0 is closed
- Claiming Production Ready for Service Points

## Related

- Checkout delivery capabilities: `lib/checkout/delivery-capabilities-v1.ts`
- API: `app/api/shipping/service-points/`
