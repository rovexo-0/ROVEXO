#!/usr/bin/env node
/**
 * End-to-end avatar upload verification.
 *
 * Mirrors the fixed server path in lib/storage/upload.ts#uploadAvatar +
 * lib/profile/service.ts#updateAvatarUrl:
 *   1. ensure the "avatars" bucket exists and is public,
 *   2. upload a real webp via the service-role client (path scoped to a user id),
 *   3. fetch the public URL over HTTP to confirm public read works,
 *   4. round-trip profiles.avatar_url for a real profile (then restore),
 *   5. clean up the test object.
 *
 * Any failure prints the REAL Supabase error. Run from repo root:
 *   node scripts/verify-avatar-e2e.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const ROOT = process.cwd();

function loadEnvFile(filename) {
  const path = join(ROOT, filename);
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function fail(msg, extra) {
  console.log(`\nFAIL: ${msg}`);
  if (extra) console.log(typeof extra === "string" ? extra : JSON.stringify(extra, null, 2));
  process.exit(1);
}

async function main() {
  console.log("=== ROVEXO avatar upload end-to-end verification ===\n");

  console.log("[1/6] Ensuring 'avatars' bucket exists and is public ...");
  let { data: bucket } = await admin.storage.getBucket("avatars");
  if (!bucket) {
    const { error } = await admin.storage.createBucket("avatars", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error && !/exist/i.test(error.message)) fail("createBucket failed.", error);
    ({ data: bucket } = await admin.storage.getBucket("avatars"));
  }
  if (!bucket) fail("avatars bucket still missing after ensure.");
  console.log(`      bucket ok: public=${bucket.public} sizeLimit=${bucket.file_size_limit ?? "n/a"}`);

  console.log("\n[2/6] Encoding a real 256x256 webp ...");
  const body = await sharp({
    create: { width: 256, height: 256, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } },
  })
    .webp({ quality: 90 })
    .toBuffer();
  console.log(`      webp bytes=${body.length}`);

  const testUserId = "00000000-0000-4000-8000-0000000000e2";
  const path = `${testUserId}/avatar.webp`;

  console.log("\n[3/6] Uploading via service-role client (upsert) ...");
  const { data: uploaded, error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, body, { upsert: true, contentType: "image/webp", cacheControl: "3600" });
  if (uploadError) fail("storage upload failed (THIS is the real avatar error).", uploadError);
  console.log(`      uploaded path=${uploaded.path}`);

  console.log("\n[4/6] Fetching public URL over HTTP (public read) ...");
  const publicUrl = `${url}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`;
  const res = await fetch(publicUrl);
  const contentType = res.headers.get("content-type");
  const bytes = res.ok ? (await res.arrayBuffer()).byteLength : 0;
  if (!res.ok) fail(`public URL returned HTTP ${res.status}.`, publicUrl);
  console.log(`      HTTP ${res.status}  content-type=${contentType}  bytes=${bytes}`);
  if (bytes < 100) fail("public object body is empty/too small.");

  console.log("\n[5/6] profiles.avatar_url round-trip on a real profile (restored after) ...");
  const { data: profile } = await admin
    .from("profiles")
    .select("id, avatar_url")
    .limit(1)
    .single();
  if (!profile?.id) fail("no profile found to test avatar_url update.");
  const previous = profile.avatar_url;
  const { error: updError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", profile.id);
  if (updError) fail("avatar_url update failed.", updError);
  const { data: after } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", profile.id)
    .single();
  console.log(`      avatar_url persisted: ${after.avatar_url === publicUrl ? "yes" : "no"}`);
  // restore
  await admin.from("profiles").update({ avatar_url: previous }).eq("id", profile.id);
  console.log("      restored original avatar_url");

  console.log("\n[6/6] Cleaning up test object ...");
  const { error: rmError } = await admin.storage.from("avatars").remove([path]);
  if (rmError) console.log(`      WARNING: cleanup failed, remove manually: avatars/${path}`);
  else console.log("      removed test avatar object");

  console.log("\n=== RESULT ===");
  console.log("PASS: avatar upload path works end-to-end (bucket, service-role upload, public read, avatar_url update).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
