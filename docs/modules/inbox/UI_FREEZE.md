# Inbox Hub v1.0 — UI Freeze

| Field | Value |
|-------|-------|
| Module | Inbox Hub |
| Version | v1.0 |
| STATUS | **FROZEN** |
| Canonical status | `CANONICAL_FROZEN_v1.0` |
| Frozen | `INBOX_HUB_CANONICAL_FROZEN = true` |
| DOM | `data-inbox-freeze="FROZEN"` / `data-conversation-freeze="FROZEN"` |
| Spec | `docs/modules/inbox/MASTER_UI_SPECIFICATION.md` |
| Freeze constant | `lib/inbox/freeze.ts` |

## Immutable reference

- Routes: `/inbox`, `/inbox/conversation/[conversationId]`
- List UI: `InboxPage` + `inbox-hub-v1.css`
- Conversation UI: `ConversationHub` + `conversation-hub-v1.css`
- Legacy redirects only: `/messages`, `/messages/[id]`, `/notifications`

## Post-freeze

No UI modifications under Inbox Hub v1.0.  
Ship deltas as Inbox Hub **v1.1** only.
