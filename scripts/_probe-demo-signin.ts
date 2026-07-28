import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import { getSupabaseAnonKey, getSupabaseUrl } from "../lib/supabase/env";

(function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
})();

async function main() {
  const buyer = FULL_DEMO_ACCOUNTS[0]!;
  console.log("email", buyer.email);
  console.log("url_host", new URL(getSupabaseUrl()).host);
  const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const t0 = Date.now();
  const { data, error } = await client.auth.signInWithPassword({
    email: buyer.email,
    password: buyer.password ?? "",
  });
  console.log("ms", Date.now() - t0);
  console.log("user", data.user?.id ? "yes" : "no");
  console.log("session", data.session ? "yes" : "no");
  if (error) {
    console.log("error_name", error.name);
    console.log("error_status", (error as { status?: number }).status);
    console.log("error_message", error.message);
    console.log("error_json", JSON.stringify(error, Object.getOwnPropertyNames(error)));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
