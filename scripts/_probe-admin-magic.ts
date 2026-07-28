import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { FULL_DEMO_ACCOUNTS } from "../lib/full-demo/canonical";
import { createAdminClient } from "../lib/supabase/admin";
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
  const admin = createAdminClient();
  const t0 = Date.now();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: buyer.email,
  });
  console.log("generateLink_ms", Date.now() - t0);
  console.log("generateLink_err", error?.message ?? null);
  const props = data?.properties as Record<string, unknown> | undefined;
  console.log("prop_keys", props ? Object.keys(props) : []);
  if (error || !props) process.exit(2);

  const anon = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tokenCandidates = [
    String(props.email_otp ?? ""),
    String(props.hashed_token ?? ""),
  ].filter(Boolean);

  for (const token of tokenCandidates) {
    for (const typ of ["email", "magiclink"] as const) {
      const t1 = Date.now();
      const verify = await anon.auth.verifyOtp({
        email: buyer.email,
        token,
        type: typ,
      });
      console.log(
        `verify typ=${typ} token=${token.slice(0, 6)}… ms=${Date.now() - t1} err=${verify.error?.message ?? "null"} session=${Boolean(verify.data.session)}`,
      );
      if (verify.data.session) process.exit(0);
    }
  }

  const action = String(props.action_link ?? "");
  console.log("has_action_link", Boolean(action));
  process.exit(3);
}

main().catch((e) => {
  console.error(String(e).slice(0, 300));
  process.exit(1);
});
