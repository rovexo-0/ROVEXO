# Buyer Journey — Certification Cross-References

| Step | Evidence | Result |
|------|----------|--------|
| Register | Auth UI freeze + oauth-rc1 register surface; Security final Register path historically covered | CROSS-REF (no regression suspected) |
| Email Login | Full Demo 01 + 25 | PASS (this acceptance run pending Full Demo) |
| Google Login | Security final: Google OAuth provider PASS; Auth UI Master Freeze removes OAuth buttons from Login/Register | CROSS-REF / N-A UI (freeze) |
| MFA | `MFA_LIVE_CERTIFICATION.md` 29/29 · Security final MFA TOTP PASS | CROSS-REF |
| Search→Logout commerce | Full Demo 05–25 | PASS when Full Demo green |

