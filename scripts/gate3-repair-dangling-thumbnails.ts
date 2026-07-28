/**
 * GATE 3 — Repair dangling product_images.thumbnail_url only.
 *
 * Updates thumbnail_url → url when the thumbnail Storage object does not exist.
 * Does not modify any other product / image columns.
 */
import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "../lib/supabase/admin";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

async function thumbObjectExists(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok) return true;
    const get = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" } });
    return get.ok || get.status === 206;
  } catch {
    return false;
  }
}

async function main() {
  loadEnvLocal();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("product_images")
    .select("id, url, thumbnail_url, product_id")
    .not("thumbnail_url", "is", null)
    .like("thumbnail_url", "%-thumb.%")
    .limit(1000);

  if (error) throw error;

  let scanned = 0;
  let skippedOk = 0;
  let skippedSame = 0;
  let repaired = 0;
  const repairedRows: Array<{ id: string; product_id: string }> = [];

  for (const row of data ?? []) {
    scanned += 1;
    const thumb = typeof row.thumbnail_url === "string" ? row.thumbnail_url : "";
    const url = typeof row.url === "string" ? row.url : "";
    if (!thumb || !url || thumb === url) {
      skippedSame += 1;
      continue;
    }
    if (await thumbObjectExists(thumb)) {
      skippedOk += 1;
      continue;
    }

    const { error: upErr } = await admin
      .from("product_images")
      .update({ thumbnail_url: url })
      .eq("id", row.id);

    if (upErr) {
      console.error("REPAIR_FAIL", row.id, upErr.message);
      process.exitCode = 1;
      continue;
    }

    repaired += 1;
    repairedRows.push({ id: String(row.id), product_id: String(row.product_id) });
    console.log("repaired", row.id, "product", row.product_id);
  }

  console.log(
    JSON.stringify(
      {
        gate: "GATE_3",
        action: "repair_dangling_thumbnail_url_only",
        scanned,
        skippedOk,
        skippedSame,
        repaired,
        repairedRows,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
