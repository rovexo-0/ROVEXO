/**
 * Verify the official Owner preview URL responds (Policy v3.0).
 * Default: https://www.rovexo.co.uk
 * Usage: npm run verify:dev-preview
 * Override: ROVEXO_DEV_PREVIEW_URL=https://…
 */
const DEV_PREVIEW_URL =
  process.env.ROVEXO_DEV_PREVIEW_URL ?? "https://www.rovexo.co.uk";

/** Splash removed — health via home + live probe only. */
const paths = ["/", "/login", "/api/health/live"];

async function check(path) {
  const url = `${DEV_PREVIEW_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const ok = res.status >= 200 && res.status < 400;
  return { path, url, status: res.status, ok };
}

async function main() {
  console.log(`ROVEXO Official Owner URL (Policy v3.0): ${DEV_PREVIEW_URL}\n`);

  const results = await Promise.all(paths.map((path) => check(path)));
  let failed = false;

  for (const row of results) {
    const mark = row.ok ? "✓" : "✗";
    console.log(`${mark} ${row.status} ${row.path}`);
    if (!row.ok) failed = true;
  }

  if (failed) {
    console.error("\nOwner preview verification failed.");
    console.error("Official URL must be public HTTPS and Owner-accessible on mobile.");
    process.exit(1);
  }

  console.log("\nOfficial Owner URL is live (one permanent domain).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
