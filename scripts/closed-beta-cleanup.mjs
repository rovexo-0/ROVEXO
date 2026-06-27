/**
 * Closed Beta: purge development/test data only.
 * - Hard-delete soft-deleted listings with test titles
 * - Remove E2E and runtime test auth users (+ profiles)
 * Does NOT touch non-test deleted seller inventory.
 */
import { loadDotEnvFiles } from "./playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin.ts";

loadDotEnvFiles();

const TEST_PRODUCT_PATTERNS = [
  /runtime\s*test/i,
  /\btest\b/i,
  /\bdemo\b/i,
  /placeholder/i,
  /\bqa\b/i,
  /\bseed\b/i,
  /mulisoft/i,
];

const TEST_USER_PATTERNS = [
  /@example\.test$/i,
  /mailinator\.com$/i,
  /^e2e[\s_-]/i,
  /^runtime\.publish/i,
  /^rt\d+/i,
];

function isTestProduct(title, slug) {
  const hay = `${title ?? ""} ${slug ?? ""}`;
  return TEST_PRODUCT_PATTERNS.some((pattern) => pattern.test(hay));
}

function isTestUser(email, username) {
  const hay = `${email ?? ""} ${username ?? ""}`;
  return TEST_USER_PATTERNS.some((pattern) => pattern.test(hay));
}

async function purgeTestProducts(admin) {
  const { data: products } = await admin.from("products").select("id, title, slug, status, seller_id");
  const targets = (products ?? []).filter((p) => isTestProduct(p.title, p.slug));

  const removed = [];
  for (const product of targets) {
    await admin.from("product_images").delete().eq("product_id", product.id);
    await admin.from("saved_items").delete().eq("product_id", product.id);
    const { error } = await admin.from("products").delete().eq("id", product.id);
    if (error) {
      removed.push({ id: product.id, title: product.title, error: error.message });
    } else {
      removed.push({ id: product.id, title: product.title, status: "purged" });
    }
  }
  return removed;
}

async function purgeTestUsers(admin) {
  const { data: profiles } = await admin.from("profiles").select("id, email, username");
  const targets = (profiles ?? []).filter((p) => isTestUser(p.email, p.username));

  const removed = [];
  for (const profile of targets) {
    const userId = profile.id;
    const { data: userProducts } = await admin.from("products").select("id").eq("seller_id", userId);
    for (const product of userProducts ?? []) {
      await admin.from("product_images").delete().eq("product_id", product.id);
      await admin.from("saved_items").delete().eq("product_id", product.id);
      await admin.from("products").delete().eq("id", product.id);
    }

    await admin.from("seller_profiles").delete().eq("id", userId);
    await admin.from("saved_items").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);

    const { error } = await admin.auth.admin.deleteUser(userId);
    removed.push({
      id: userId,
      email: profile.email,
      status: error ? `auth_error: ${error.message}` : "purged",
    });
  }
  return removed;
}

async function main() {
  const admin = createAdminClient();
  const products = await purgeTestProducts(admin);
  const users = await purgeTestUsers(admin);

  console.log(JSON.stringify({ purgedProducts: products, purgedUsers: users }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
