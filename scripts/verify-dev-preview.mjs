/**
 * Verify the permanent develop-branch preview URL responds.
 * Usage: npm run verify:dev-preview
 */
const DEV_PREVIEW_URL =
  process.env.ROVEXO_DEV_PREVIEW_URL ??
  "https://rovexo-git-develop-rovexo.vercel.app";

const paths = ["/", "/splash", "/api/health/live"];

async function check(path) {
  const url = `${DEV_PREVIEW_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const ok = res.status >= 200 && res.status < 400;
  return { path, url, status: res.status, ok };
}

async function main() {
  console.log(`ROVEXO dev preview: ${DEV_PREVIEW_URL}\n`);

  const results = await Promise.all(paths.map((path) => check(path)));
  let failed = false;

  for (const row of results) {
    const mark = row.ok ? "✓" : "✗";
    console.log(`${mark} ${row.status} ${row.path}`);
    if (!row.ok) failed = true;
  }

  if (failed) {
    console.error("\nDev preview verification failed.");
    process.exit(1);
  }

  console.log("\nDev preview is live.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
