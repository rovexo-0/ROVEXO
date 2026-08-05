# P9.3 — ROVEXO Ideas HTTP 400 Root Cause Audit

**STATUS:** ROOT CAUSE PROVEN · **NO FIX APPLIED**  
**Law:** Cod Sânge · Evidence first · No business-logic / UI / API-contract changes · No commit / push / deploy  

---

## Verdict

| Item | Value |
|---|---|
| **Root cause** | Live DB missing community columns on `public.rovexo_ideas` (`category`, `like_count`, …). Migration `20260731123000_rovexo_ideas_community_v1.sql` **not applied** to the connected Supabase project. |
| **Not the cause** | Empty `q` · `filter=top` · request builder · Zod schema rejection for this URL |
| **HTTP 400 line** | `app/api/account/ideas/route.ts` **L50–L54** (`catch` after `listCommunityIdeas`) |
| **Rejected parameter** | **None** (query validates). Failure is **repository / Postgres column** |
| **Response body** | `{ "error": "Unable to load ideas." }` |

---

## Reproduce (proven)

### Actual request (UI + terminal + authenticated replay)

```
GET /api/account/ideas?filter=top&q=&limit=20
→ HTTP 400
→ {"error":"Unable to load ideas."}
```

Terminal (prior Owner session):

```
GET /api/account/ideas?filter=top&q=&limit=20 400
GET /api/account/ideas?stats=1 200
```

### Expected request (schema + UI)

| Param | Expected | Actual | Schema result |
|---|---|---|---|
| `filter` | one of `top` \| `latest` \| `under_review` \| `planned` \| `released` \| `declined` (default `top`) | `top` | **PASS** |
| `q` | string ≤120, optional, default `""` (empty allowed) | `""` | **PASS** |
| `limit` | coerce int 1–40, default 20 | `20` | **PASS** |
| `cursor` | optional string | omitted | **PASS** |

Zod evidence (same shape as route):

```json
{ "success": true, "data": { "filter": "top", "q": "", "limit": 20 } }
```

Contrast — invalid filter (proves schema path):

```
GET /api/account/ideas?filter=bogus&q=&limit=20
→ 400 {"error":"Invalid query."}
```

→ Owner URL returns **`Unable to load ideas.`**, not **`Invalid query.`** → **not** L37–L38 schema branch.

---

## Request builder (UI)

`features/account-module/components/RovexoIdeasPage.tsx` `loadFeed`:

```ts
const params = new URLSearchParams({
  filter,           // default state "top"
  q: debouncedSearch, // "" when search empty
  limit: "20",
});
fetch(`/api/account/ideas?${params.toString()}`, { cache: "no-store" });
```

Builds exactly: `?filter=top&q=&limit=20` when search is empty. **Correct vs schema.** Empty `q` is intentional and accepted.

---

## Route / response path returning 400

File: `app/api/account/ideas/route.ts`

| Branch | Lines | Status | Body | Hits for Owner URL? |
|---|---|---|---|---|
| Auth fail | `requireApiAuth` | 401 | Unauthorized | No (Owner was authenticated; replay authenticated) |
| `similar` | L19–22 | 200 | `{ ideas }` | No |
| `stats=1` | L25–27 | 200 | `{ stats }` | Separate call — **works** |
| `!parsed.success` | **L37–38** | 400 | `Invalid query.` | **No** |
| `listCommunityIdeas` success | L41–49 | 200 | feed JSON | No |
| **`catch`** | **L50–54** | **400** | `error.message` or fallback | **YES** |

Exact returning lines:

```50:54:app/api/account/ideas/route.ts
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load ideas." },
      { status: 400 },
    );
  }
```

Throw site:

```184:187:lib/rovexo-ideas/repository.ts
  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load ideas.");
  }
```

Select that fails (includes missing columns):

```160:165:lib/rovexo-ideas/repository.ts
  let query = supabase
    .from("rovexo_ideas")
    .select(
      `${IDEA_SELECT}, profiles!rovexo_ideas_user_id_fkey ( email, full_name, avatar_url )`,
    )
    .limit(limit + 1);
```

`IDEA_SELECT` includes `category`, `like_count`, `dislike_count`, `comment_count`, `follow_count` (`repository.ts` L42–43).

---

## Stack (evidence chain)

```
RovexoIdeasPage.loadFeed
  → GET /api/account/ideas?filter=top&q=&limit=20
  → app/api/account/ideas/route.ts GET
  → listIdeasQuerySchema.safeParse  ✅ PASS
  → listCommunityIdeas(...)
  → supabase.from("rovexo_ideas").select(...category, like_count...)
  → Postgres 42703: column rovexo_ideas.category does not exist
  → throw new Error("Unable to load ideas.")
  → catch → NextResponse.json(..., { status: 400 })
```

### Supabase probe (demo.buyer authenticated, anon client)

| Probe | Result |
|---|---|
| Exact `listCommunityIdeas` select + `order(like_count)` | **ERROR** `42703` **`column rovexo_ideas.category does not exist`** |
| Select with `like_count` only | **ERROR** `42703` **`column rovexo_ideas.like_count does not exist`** |
| Select `id` only | **OK** (0 rows) |
| API list URL | **400** `{ "error": "Unable to load ideas." }` |
| API `stats=1` | **200** (stats path does not require those columns the same way / returns zeros) |

---

## Root cause (single)

**Database schema drift:** application code (community Ideas v1) expects columns added by migration:

`supabase/migrations/20260731123000_rovexo_ideas_community_v1.sql`

```sql
alter table public.rovexo_ideas
  add column if not exists category text not null default 'Buying',
  add column if not exists like_count integer not null default 0,
  ...
```

Live project still matches base table from `20260708160000_rovexo_ideas_v2_1.sql` (no `category` / vote counters).

→ Query fails → repository throw → route **L50–54** returns **400**.

This is **ops / migration application**, not a bad `q` or `filter` from the UI.

---

## Category classification

| Layer | Status |
|---|---|
| Request builder | PASS (matches schema) |
| Empty `q` | PASS (accepted) |
| `filter=top` | PASS (accepted) |
| Query validator | PASS for actual URL |
| API contract for this URL | Valid request |
| Repository / DB | **FAIL** — missing columns |
| Route 400 | **Catch path** masking Postgres `42703` |

---

## What was not changed

- Business logic · UI · API contracts · schemas · repository · migrations applied  
- Commit / push / deploy  

---

## Fix gate (Owner only — not executed)

Apply migration `20260731123000_rovexo_ideas_community_v1.sql` to the live Supabase project (or equivalent `ALTER TABLE` adding community columns + related objects), then re-hit:

`GET /api/account/ideas?filter=top&q=&limit=20` → expect **200**.

No API contract change required if migration matches the already-shipped code.
