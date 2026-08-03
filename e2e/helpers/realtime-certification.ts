/**
 * Realtime Certification Engine v1.0 — Playwright helpers.
 * Evidence only · dual-browser · no F5 · localhost:3000.
 */
import fs from "node:fs";
import path from "node:path";
import { expect, type Browser, type Page } from "@playwright/test";
import {
  REALTIME_EVIDENCE_DIR,
  REALTIME_MAX_LATENCY_MS,
  REALTIME_WORKFLOWS,
  type RealtimeCellResult,
  type RealtimeEvidenceSnapshot,
  type RealtimeWorkflowEvidence,
} from "../../lib/realtime/realtime-certification-engine-v1";
import { FULL_DEMO_ACCOUNTS } from "../../lib/full-demo/canonical";
import { signInWithSessionCookies } from "./auth";

const BUYER = FULL_DEMO_ACCOUNTS[0]!;
const SELLER = FULL_DEMO_ACCOUNTS[1]!;

export function evidenceDir(): string {
  const dir = path.join(process.cwd(), REALTIME_EVIDENCE_DIR);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function auditArchitectureWorkflows(): RealtimeWorkflowEvidence[] {
  const root = process.cwd();
  return REALTIME_WORKFLOWS.map((workflow) => {
    const defects: string[] = [];
    const sources = workflow.architecturePaths.map((rel) => {
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs)) {
        defects.push(`Missing file: ${rel}`);
        return "";
      }
      return fs.readFileSync(abs, "utf8");
    });
    const joined = sources.join("\n");

    for (const marker of workflow.requiredMarkers) {
      if (!joined.includes(marker)) {
        defects.push(`Missing marker "${marker}"`);
      }
    }
    for (const marker of workflow.forbiddenMarkers ?? []) {
      if (joined.includes(marker)) {
        defects.push(`Forbidden marker "${marker}" present`);
      }
    }

    return {
      id: workflow.id,
      domain: workflow.domain,
      label: workflow.label,
      architecture: (defects.length === 0 ? "PASS" : "FAIL") as RealtimeCellResult,
      live: (workflow.liveRequired ? "UNVERIFIED" : "SKIP") as RealtimeCellResult,
      latencyMs: null,
      defects,
    };
  });
}

async function dismissCookieBanner(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /cookie/i });
  const accept = page.getByRole("button", { name: /^Accept$/i });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const visible = await accept.isVisible().catch(() => false);
    if (!visible) break;
    await accept.click({ force: true });
    await page.waitForTimeout(200);
  }
  await expect(dialog)
    .toBeHidden({ timeout: 5_000 })
    .catch(() => undefined);
}

function visibleComposer(page: Page) {
  return page.locator("#conv-hub-composer").filter({ visible: true }).first();
}

function sendMessageButton(page: Page) {
  return page.locator('button[aria-label="Send message"]').filter({ visible: true }).first();
}

type ConversationListItem = {
  id: string;
  product?: { slug?: string; title?: string };
};

async function listConversations(page: Page): Promise<ConversationListItem[]> {
  const response = await page.request.get("/api/messages");
  if (!response.ok()) return [];
  const payload = (await response.json()) as { conversations?: ConversationListItem[] };
  return payload.conversations ?? [];
}

async function resolveSharedConversation(
  buyerPage: Page,
  sellerPage: Page,
): Promise<string | null> {
  const buyerList = await listConversations(buyerPage);
  if (buyerList[0]?.id) return buyerList[0].id;

  // Create via a published seller listing slug when inbox empty.
  const listingRes = await sellerPage.request.get("/api/account/snapshot");
  // Fallback: scrape homepage for a listing link
  await buyerPage.goto("/", { waitUntil: "domcontentloaded" });
  const href = await buyerPage
    .locator('a[href^="/listing/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  const slug = href?.replace(/^\/listing\//, "").split("?")[0] ?? null;
  if (!slug) {
    void listingRes;
    return null;
  }

  const create = await buyerPage.request.post("/api/messages", {
    data: { productSlug: slug },
  });
  if (!create.ok()) return null;
  const body = (await create.json()) as { conversationId?: string };
  return body.conversationId ?? null;
}

export async function runLiveMessageRealtime(
  browser: Browser,
  baseURL: string,
): Promise<{
  pass: boolean;
  latencyMs: number | null;
  badgeLatencyMs: number | null;
  defects: string[];
  conversationId: string | null;
}> {
  const defects: string[] = [];
  let latencyMs: number | null = null;
  let badgeLatencyMs: number | null = null;
  let conversationId: string | null = null;

  const buyerCtx = await browser.newContext();
  const sellerCtx = await browser.newContext();
  const buyerPage = await buyerCtx.newPage();
  const sellerPage = await sellerCtx.newPage();

  try {
    await signInWithSessionCookies(buyerPage, {
      email: BUYER.email,
      password: BUYER.password,
      baseURL,
    });
    await signInWithSessionCookies(sellerPage, {
      email: SELLER.email,
      password: SELLER.password,
      baseURL,
    });

    conversationId = await resolveSharedConversation(buyerPage, sellerPage);
    if (!conversationId) {
      defects.push("No shared conversation available for dual-browser message test");
      return {
        pass: false,
        latencyMs: null,
        badgeLatencyMs: null,
        defects,
        conversationId: null,
      };
    }

    const hubPath = `/inbox/conversation/${conversationId}`;
    await Promise.all([
      buyerPage.goto(hubPath, { waitUntil: "domcontentloaded" }),
      sellerPage.goto(hubPath, { waitUntil: "domcontentloaded" }),
    ]);

    await dismissCookieBanner(buyerPage);
    await dismissCookieBanner(sellerPage);

    await expect(visibleComposer(buyerPage)).toBeVisible({ timeout: 20_000 });
    await expect(visibleComposer(sellerPage)).toBeVisible({ timeout: 20_000 });

    await buyerPage.bringToFront();
    /* Fail closed: never send until Realtime channel is SUBSCRIBED (race root cause). */
    try {
      await buyerPage.waitForFunction(
        () => {
          const fromDoc = document.documentElement.getAttribute("data-realtime-messages-status");
          const fromHub = document
            .querySelector("[data-conversation-realtime='live']")
            ?.getAttribute("data-realtime-messages-status");
          return fromDoc === "SUBSCRIBED" || fromHub === "SUBSCRIBED";
        },
        { timeout: 15_000 },
      );
    } catch {
      const diag = await buyerPage.evaluate(() => ({
        docStatus: document.documentElement.getAttribute("data-realtime-messages-status"),
        supabaseClient: document.documentElement.getAttribute("data-supabase-client"),
        hubRealtime: document
          .querySelector("[data-conversation-realtime]")
          ?.getAttribute("data-conversation-realtime"),
        hubStatus: document
          .querySelector("[data-conversation-realtime]")
          ?.getAttribute("data-realtime-messages-status"),
        hasComposer: Boolean(document.querySelector("#conv-hub-composer")),
        href: location.href,
        publicUrlDefined: Boolean(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (globalThis as any).process?.env?.NEXT_PUBLIC_SUPABASE_URL,
        ),
      }));
      defects.push(
        `Buyer Realtime channel never reached SUBSCRIBED before send (diag=${JSON.stringify(diag)})`,
      );
      return {
        pass: false,
        latencyMs: null,
        badgeLatencyMs: null,
        defects,
        conversationId,
      };
    }

    const marker = `RT-CERT-${Date.now()}`;
    const t0 = Date.now();
    const sendRes = await sellerPage.request.post(`/api/messages/${conversationId}`, {
      data: {
        content: marker,
        senderRole: "seller",
        kind: "text",
      },
    });
    if (!sendRes.ok()) {
      defects.push(`Seller API send failed: HTTP ${sendRes.status()}`);
      return {
        pass: false,
        latencyMs: null,
        badgeLatencyMs: null,
        defects,
        conversationId,
      };
    }

    await buyerPage.bringToFront();
    await buyerPage.evaluate(() => {
      const scroller =
        document.querySelector("[data-conversation-scroll]") ||
        document.querySelector(".conv-hub__messages") ||
        document.scrollingElement;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });

    const buyerBubble = buyerPage.getByText(marker, { exact: false });
    try {
      await buyerBubble.first().waitFor({ state: "attached", timeout: REALTIME_MAX_LATENCY_MS });
      await buyerBubble.first().scrollIntoViewIfNeeded();
      await expect(buyerBubble.first()).toBeVisible({ timeout: 2_000 });
      latencyMs = Date.now() - t0;
    } catch {
      defects.push(
        `Buyer did not receive message within ${REALTIME_MAX_LATENCY_MS}ms without refresh (marker=${marker})`,
      );
      return {
        pass: false,
        latencyMs: Date.now() - t0,
        badgeLatencyMs: null,
        defects,
        conversationId,
      };
    }

    if (latencyMs > REALTIME_MAX_LATENCY_MS) {
      defects.push(`Message latency ${latencyMs}ms exceeds ${REALTIME_MAX_LATENCY_MS}ms`);
    }

    /* Concurrent stress — 5 seller inserts; buyer must receive all without refresh. */
    const stressMarkers = Array.from({ length: 5 }, (_, i) => `RT-STRESS-${Date.now()}-${i}`);
    const stressT0 = Date.now();
    const stressResults = await Promise.all(
      stressMarkers.map((content) =>
        sellerPage.request.post(`/api/messages/${conversationId}`, {
          data: { content, senderRole: "seller", kind: "text" },
        }),
      ),
    );
    if (stressResults.some((r) => !r.ok())) {
      defects.push("Stress send: one or more concurrent API posts failed");
    } else {
      await buyerPage.bringToFront();
      for (const markerStress of stressMarkers) {
        try {
          await buyerPage
            .getByText(markerStress, { exact: false })
            .first()
            .waitFor({ state: "attached", timeout: REALTIME_MAX_LATENCY_MS });
        } catch {
          defects.push(
            `Stress: buyer missing concurrent marker ${markerStress} within ${REALTIME_MAX_LATENCY_MS}ms`,
          );
          break;
        }
      }
      const stressLatencyMs = Date.now() - stressT0;
      if (stressLatencyMs > REALTIME_MAX_LATENCY_MS * 2) {
        defects.push(`Stress batch latency ${stressLatencyMs}ms exceeds ${REALTIME_MAX_LATENCY_MS * 2}ms`);
      }
    }

    // Same buyer session → Inbox list must update without F5.
    await buyerPage.goto("/inbox", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(buyerPage);
    await buyerPage.bringToFront();
    await buyerPage.waitForTimeout(2_500);

    const badgeMarker = `RT-BADGE-${Date.now()}`;
    const badgeT0 = Date.now();
    const badgeSend = await sellerPage.request.post(`/api/messages/${conversationId}`, {
      data: {
        content: badgeMarker,
        senderRole: "seller",
        kind: "text",
      },
    });
    if (!badgeSend.ok()) {
      defects.push(`Seller API badge send failed: HTTP ${badgeSend.status()}`);
    } else {
      await buyerPage.bringToFront();
      try {
        const row = buyerPage.getByText(badgeMarker, { exact: false }).first();
        await row.waitFor({ state: "attached", timeout: REALTIME_MAX_LATENCY_MS });
        await expect(row).toBeVisible({ timeout: 2_000 });
        badgeLatencyMs = Date.now() - badgeT0;
      } catch {
        const listRes = await buyerPage.request.get("/api/messages");
        const list = listRes.ok()
          ? ((await listRes.json()) as { conversations?: { lastMessage?: string }[] })
          : null;
        const apiHas = Boolean(
          list?.conversations?.some((c) => (c.lastMessage ?? "").includes(badgeMarker)),
        );
        defects.push(
          apiHas
            ? `Inbox UI stale — API has marker but DOM missing within ${REALTIME_MAX_LATENCY_MS}ms (share-cache / RT refresh FAIL)`
            : `Inbox list did not show new message within ${REALTIME_MAX_LATENCY_MS}ms without refresh`,
        );
      }
    }

    return {
      pass: defects.length === 0,
      latencyMs,
      badgeLatencyMs,
      defects,
      conversationId,
    };
  } finally {
    await buyerCtx.close();
    await sellerCtx.close();
  }
}

/** Badge/list evidence is collected inside runLiveMessageRealtime (same session). */
export async function runLiveBadgeUnreadRealtime(
  _browser: Browser,
  _baseURL: string,
  _conversationId: string | null,
  fromMessage?: {
    pass: boolean;
    badgeLatencyMs: number | null;
    defects: string[];
  },
): Promise<{ pass: boolean; latencyMs: number | null; defects: string[] }> {
  if (!fromMessage) {
    return { pass: false, latencyMs: null, defects: ["Badge evidence missing from message session"] };
  }
  const badgeDefects = fromMessage.defects.filter(
    (d) => d.includes("Inbox") || d.includes("badge send"),
  );
  return {
    pass: badgeDefects.length === 0 && fromMessage.badgeLatencyMs != null,
    latencyMs: fromMessage.badgeLatencyMs,
    defects: badgeDefects,
  };
}

export function writeRealtimeEvidence(snapshot: RealtimeEvidenceSnapshot): void {
  const dir = evidenceDir();
  fs.writeFileSync(path.join(dir, "matrix.json"), JSON.stringify(snapshot, null, 2));
  const perfLines = Object.entries(snapshot.performance).map(
    ([k, v]) => `- ${k}: ${v ?? "n/a"}ms`,
  );
  const lines = [
    `# REALTIME ENGINE CERTIFICATION ${snapshot.version}`,
    ``,
    `Origin: ${snapshot.origin}`,
    `Generated: ${snapshot.generatedAt}`,
    `Overall: **${snapshot.overall}**`,
    `Max latency: ${snapshot.maxLatencyMs}ms`,
    ``,
    `| Workflow | Domain | Architecture | Live | Latency | Defects |`,
    `|---|---|---|---|---|---|`,
    ...snapshot.workflows.map(
      (w) =>
        `| ${w.label} | ${w.domain} | ${w.architecture} | ${w.live} | ${
          w.latencyMs ?? "—"
        } | ${w.defects.join("; ") || "—"} |`,
    ),
    ``,
    `## Performance`,
    ...(perfLines.length ? perfLines : ["- n/a"]),
    ``,
    `## Defects`,
    ...(snapshot.defects.length
      ? snapshot.defects.map((d) => `- ${d}`)
      : ["- none"]),
    ``,
    `## Verdict`,
    ``,
    `REALTIME CERTIFICATION = ${snapshot.overall === "PASS" ? "PASS" : "FAIL"}`,
    ``,
  ];
  fs.writeFileSync(path.join(dir, "MATRIX.md"), lines.join("\n"));

  // Per-domain evidence files (v1.2 independent proof).
  for (const w of snapshot.workflows) {
    const safe = w.id.replace(/[^a-z0-9_-]+/gi, "_");
    fs.writeFileSync(
      path.join(dir, `DOMAIN_${safe}.md`),
      [
        `# Domain evidence — ${w.label}`,
        ``,
        `- id: ${w.id}`,
        `- domain: ${w.domain}`,
        `- architecture: ${w.architecture}`,
        `- live: ${w.live}`,
        `- latencyMs: ${w.latencyMs ?? "null"}`,
        `- defects: ${w.defects.join(" | ") || "none"}`,
        ``,
        `PASS requires live=PASS and measured latency ≤ ${snapshot.maxLatencyMs}ms.`,
        ``,
      ].join("\n"),
    );
  }
}
