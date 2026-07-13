# ROVEXO — Permanent Development Preview (v1.0)

Single stable preview URL for the entire ROVEXO v1.0 implementation sprint.
Production (`https://www.rovexo.co.uk`) is **not** updated by pushes to `develop`.

## Permanent preview URL

**https://rovexo-git-develop-rovexo.vercel.app**

| Property | Value |
|----------|--------|
| Branch | `develop` |
| Vercel environment | Preview |
| URL type | Git branch URL (stable — does **not** change per commit) |
| Production branch | `main` only |

Vercel assigns one persistent **branch URL** per Git branch. Every push to `develop`
redeploys the **same** URL above. Commit-specific URLs (`rovexo-<hash>-rovexo.vercel.app`)
are not used for v1.0 review.

## Workflow

```bash
git checkout develop
# implement feature…
git add -A && git commit -m "feat(auth): …"
git push origin develop
# → https://rovexo-git-develop-rovexo.vercel.app updates automatically
```

Do **not** run `npx vercel --yes` for routine v1.0 work — that creates disposable
commit URLs. Use Git push to `develop` only.

## Deployment rules (`vercel.json`)

Only two branches auto-deploy:

- `main` → Production (`www.rovexo.co.uk`)
- `develop` → Preview (permanent URL above)

All other branches (`feature/*`, `development`, etc.) are disabled via
`git.deploymentEnabled`.

## Preview environment variables

Set in **Vercel → Project → Settings → Environment Variables → Preview**:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://rovexo-git-develop-rovexo.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://rovexo-git-develop-rovexo.vercel.app` |

Production values remain `https://www.rovexo.co.uk`.

## Verify after push

```bash
npm run verify:dev-preview
```

Or manually:

```bash
curl -sI https://rovexo-git-develop-rovexo.vercel.app/splash
```

Expect `200` once the `develop` deployment is Ready.

## Auth sprint entry points

| Screen | Path |
|--------|------|
| Splash | `/splash` |
| Welcome | `/welcome` |
| Login | `/login` |
