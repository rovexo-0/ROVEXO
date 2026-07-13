/**
 * End-to-end Seller Performance freeze verification on develop preview.
 * Usage: node scripts/verify-seller-performance-freeze.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { loadDotEnvFiles } from "./playwright-env.mjs";

loadDotEnvFiles();

const PREVIEW_URL = "https://rovexo-git-develop-rovexo.vercel.app";

function cookieHeader(cookies) {
  return cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || !anonKey) {
    throw new Error("Missing Supabase env vars.");
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const idSeed = Date.now().toString(36).slice(-6);
  const email = `support+e2e-freeze-${idSeed}@rovexo.co.uk`;
  const password = `Testpass!${idSeed}`;
  const username = `e2e_freeze_${idSeed}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { username, full_name: "Freeze QA", role: "buyer" },
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message ?? "createUser failed");

  const userId = data.user.id;
  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      username,
      full_name: "Freeze QA",
      role: "buyer",
      verified: true,
      account_status: "active",
    },
    { onConflict: "id" },
  );

  const pendingCookies = [];
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return pendingCookies.map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const index = pendingCookies.findIndex((entry) => entry.name === cookie.name);
          if (index >= 0) pendingCookies[index] = cookie;
          else pendingCookies.push(cookie);
        }
      },
    },
  });

  const signInError = (await supabase.auth.signInWithPassword({ email, password })).error;
  if (signInError) throw new Error(signInError.message);

  const cookie = cookieHeader(pendingCookies);

  const accountRes = await fetch(`${PREVIEW_URL}/account`, {
    headers: { cookie, accept: "text/html" },
    redirect: "follow",
  });
  const accountHtml = await accountRes.text();

  const dashboardRes = await fetch(`${PREVIEW_URL}/seller/performance`, {
    headers: { cookie, accept: "text/html" },
    redirect: "follow",
  });
  const dashboardHtml = await dashboardRes.text();

  const publicRes = await fetch(`${PREVIEW_URL}/api/seller/performance/${userId}`, {
    headers: { accept: "application/json" },
  });
  const publicJson = await publicRes.json();

  const apiRes = await fetch(`${PREVIEW_URL}/api/seller/performance?range=30d`, {
    headers: { cookie, accept: "application/json" },
  });
  const apiJson = apiRes.ok ? await apiRes.json() : null;

  const results = {
    account: {
      status: accountRes.status,
      url: accountRes.url,
      hasSummaryCard: accountHtml.includes('data-ac-seller-performance="v1.0"'),
      hasViewDetails: accountHtml.includes("View details"),
      hasPerformanceRoute: accountHtml.includes("/seller/performance"),
      hasScoreRing: accountHtml.includes("ac-canonical__seller-score-ring"),
      hasCompletedSales: accountHtml.includes("Completed Sales"),
    },
    dashboard: {
      status: dashboardRes.status,
      url: dashboardRes.url,
      hasReputationEngine: dashboardHtml.includes("Your Reputation Engine"),
      hasAchievements: dashboardHtml.includes("Achievements"),
      hasPublicBadges: dashboardHtml.includes("Public badges"),
      hasNotifications: dashboardHtml.includes("Notifications"),
      hasScoreTrend: dashboardHtml.includes("Score trend"),
      hasFactors: dashboardHtml.includes("Performance factors"),
      hasLatestChanges: dashboardHtml.includes("Latest changes"),
      has30Days: dashboardHtml.includes("30 Days"),
      has90Days: dashboardHtml.includes("90 Days"),
      has1Year: dashboardHtml.includes("1 Year"),
      hasAllTime: dashboardHtml.includes("All Time"),
      blockedToAccount: dashboardRes.url.includes("/account") && !dashboardRes.url.includes("/seller/performance"),
    },
    publicApi: {
      status: publicRes.status,
      keys: Object.keys(publicJson),
      hasLevel: "level" in publicJson,
      hasRating: "averageRating" in publicJson,
      hasBadges: "badges" in publicJson,
      hasCompletedSales: "completedSales" in publicJson,
      hasVerified: "verified" in publicJson,
      leaksScore: "score" in publicJson,
      leaksComponents: "componentScores" in publicJson,
      leaksAudit: "audit" in publicJson,
    },
    privateApi: {
      status: apiRes.status,
      hasScore: apiJson?.score?.score != null,
      hasProgress: apiJson?.progress != null,
      hasHistory: Array.isArray(apiJson?.scoreHistory),
      hasFactors: Array.isArray(apiJson?.factorBreakdown),
      hasAchievements: Array.isArray(apiJson?.achievements),
    },
  };

  console.log(JSON.stringify(results, null, 2));

  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);

  const pass =
    results.account.hasSummaryCard &&
    results.account.hasViewDetails &&
    results.dashboard.hasReputationEngine &&
    !results.dashboard.blockedToAccount &&
    results.publicApi.hasLevel &&
    !results.publicApi.leaksScore &&
    !results.publicApi.leaksComponents &&
    results.privateApi.hasScore;

  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
