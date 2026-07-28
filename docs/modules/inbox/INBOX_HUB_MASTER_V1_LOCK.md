# Inbox Hub Master Implementation v1.0

**STATUS: PERMANENTLY LOCKED**

## Equation

```
PROFILE + SETTINGS + FULL WIDTH + PURPLE
+ ONE FEATURE + ONE ENTRY + ONE IMPLEMENTATION
+ ONE TRANSACTION HUB
= INBOX HUB
```

## Entry

- Hub: `http://localhost:3010/inbox`
- Conversation: `/inbox/conversation/[conversationId]`
- Legacy `/messages` · `/notifications` → redirect to Inbox

## Tokens

| Token | Value |
|-------|-------|
| Header | 64px |
| Width | 100% |
| Pad (Full Width shell) | 24px |
| Primary CTA | 56px · 16px radius · 100% · purple gradient |
| Active tabs / badges | Purple gradient |

## Bottom nav

- Hub: **show**
- Conversations / transaction flows: **hide**

## What changed

- Master SSOT + Cursor rule locked.
- Visual tokens aligned to Profile / Full Width / Purple CTA.
- Hub bottom nav enabled; conversations remain full-screen.
- Orphan `MessagesEngineConversationPanel` removed (duplicate Messages UI).

## What did not change

- Auth, Stripe, Sendcloud, wallet/escrow logic, DB schema.
- Conversation composer single-row layout.
- Notifications as flat rows (no mini cards).

## Impact

| Area | Impact |
|------|--------|
| Performance | None |
| Responsive | 100% width · Full Width pad |
| Security | None |
| Database | None |
