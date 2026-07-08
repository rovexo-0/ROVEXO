#!/usr/bin/env node
/** Smoke-test routes that previously triggered runtime errors. */
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3025";
const routes = ["/", "/categories", "/search?q=phone", "/help", "/messages", "/account"];

let failed = 0;
for (const route of routes) {
  try {
    const res = await fetch(`${base}${route}`, { redirect: "follow" });
    const ok = res.status < 500;
    console.log(ok ? "OK" : "FAIL", res.status, route);
    if (!ok) failed += 1;
  } catch (error) {
    console.log("ERR", route, error instanceof Error ? error.message : error);
    failed += 1;
  }
}
process.exit(failed > 0 ? 1 : 0);
