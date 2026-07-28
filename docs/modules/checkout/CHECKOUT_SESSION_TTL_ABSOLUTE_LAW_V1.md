# ROVEXO Checkout Session Absolute Law

**STATUS:** OWNER APPROVED · IMPLEMENTATION IN PROGRESS  
**TTL:** 120 seconds (2 minutes) — Absolute Law · no exceptions.

After 120 seconds:

```
Checkout Session Expired
→ Stripe Checkout Closed
→ release_product_inventory()
→ status=published · reserved=false
→ Destroy Checkout Session
→ END
```

A listing may remain RESERVED for a maximum of **120 seconds**.
