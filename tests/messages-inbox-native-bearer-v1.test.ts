import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateMutationOrigin } from "@/lib/api/csrf-guard";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const CONV_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MESSAGES_URL = "https://www.rovexo.co.uk/api/messages";
const DETAIL_URL = `https://www.rovexo.co.uk/api/messages/${CONV_ID}`;
const REPORT_URL = `https://www.rovexo.co.uk/api/messages/${CONV_ID}/report`;
const PHOTO_URL = `https://www.rovexo.co.uk/api/messages/${CONV_ID}/photo`;
const NOTIFICATIONS_URL = "https://www.rovexo.co.uk/api/notifications";
const BADGE_URL = "https://www.rovexo.co.uk/api/inbox/badge";

const {
  verifyBearerAccessToken,
  createVerifiedBearerUserClient,
  requireApiAuth,
  listConversations,
  findOrCreateConversation,
  getConversationById,
  appendMessage,
  updateConversationPreferences,
  syncConversationOpen,
  listNotifications,
  markNotificationsRead,
  getUnreadNotificationCount,
  createContentReport,
  createAdminClient,
  enforceRateLimit,
  enforceRateLimitForUser,
  uploadMessageImage,
} = vi.hoisted(() => ({
  verifyBearerAccessToken: vi.fn(),
  createVerifiedBearerUserClient: vi.fn(),
  requireApiAuth: vi.fn(),
  listConversations: vi.fn(),
  findOrCreateConversation: vi.fn(),
  getConversationById: vi.fn(),
  appendMessage: vi.fn(),
  updateConversationPreferences: vi.fn(),
  syncConversationOpen: vi.fn(),
  listNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  createContentReport: vi.fn(),
  createAdminClient: vi.fn(),
  enforceRateLimit: vi.fn(),
  enforceRateLimitForUser: vi.fn(),
  uploadMessageImage: vi.fn(),
}));

vi.mock("@/lib/auth/verify-bearer-access-token-v1", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/verify-bearer-access-token-v1")>();
  return {
    ...actual,
    verifyBearerAccessToken,
    createVerifiedBearerUserClient,
  };
});

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    requireApiAuth,
  };
});

vi.mock("@/lib/messages/conversations", () => ({
  findOrCreateConversation,
}));

vi.mock("@/lib/messages/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/messages/store")>();
  return {
    ...actual,
    listConversations,
    getConversationById,
    appendMessage,
    updateConversationPreferences,
  };
});

vi.mock("@/lib/inbox/inbox-event-engine-v1", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/inbox/inbox-event-engine-v1")>();
  return {
    ...actual,
    syncConversationOpen,
  };
});

vi.mock("@/lib/notifications/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/notifications/store")>();
  return {
    ...actual,
    listNotifications,
    markNotificationsRead,
  };
});

vi.mock("@/lib/notifications/badge-counts-server", () => ({
  getUnreadNotificationCount,
}));

vi.mock("@/lib/moderation/service", () => ({
  createContentReport,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/api/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/rate-limit")>();
  return {
    ...actual,
    enforceRateLimit,
    enforceRateLimitForUser,
  };
});

vi.mock("@/lib/storage/upload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage/upload")>();
  return {
    ...actual,
    uploadMessageImage,
  };
});

import { GET as getMessages, PATCH as patchMessages, POST as postMessages } from "@/app/api/messages/route";
import {
  GET as getDetail,
  POST as postDetail,
  PATCH as patchDetail,
  DELETE as deleteDetail,
} from "@/app/api/messages/[id]/route";
import { POST as postReport } from "@/app/api/messages/[id]/report/route";
import { POST as postPhoto } from "@/app/api/messages/[id]/photo/route";
import { GET as getNotifications, PATCH as patchNotifications } from "@/app/api/notifications/route";
import { GET as getBadge } from "@/app/api/inbox/badge/route";

const detailContext = { params: Promise.resolve({ id: CONV_ID }) };

function profileClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { account_status: "active", role: "buyer" },
          }),
        }),
      }),
    }),
  };
}

function badgeClient() {
  const unreadQuery = {
    eq: () => unreadQuery,
    maybeSingle: async () => ({ data: { sum: 1 }, error: null }),
  };
  return {
    from: (table: string) => {
      if (table === "profiles") {
        return profileClient().from();
      }
      if (table === "conversations") {
        return { select: () => unreadQuery };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

function cookieAuth() {
  return {
    supabase: badgeClient(),
    user: { id: USER_ID, email: "web@rovexo.co.uk" },
    role: "buyer" as const,
  };
}

function nativeUser(id = USER_ID) {
  return { id, email: "native@rovexo.co.uk" };
}

function conversation(viewerId = USER_ID) {
  return {
    id: CONV_ID,
    participant: { id: USER_B, role: "seller" as const },
    viewerId,
    messages: [],
  };
}

function cookieRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      host: "www.rovexo.co.uk",
      origin: "https://www.rovexo.co.uk",
      cookie: "sb-pklotmwxtnnepaitedic-auth-token.0=cookie-session",
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function bearerRequest(url: string, method: string, token: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      host: "www.rovexo.co.uk",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("Messages / Inbox Native Bearer source contract", () => {
  it("reuses requireCookieOrBearerApiAuth on Native Inbox APIs", () => {
    const files = [
      "app/api/messages/route.ts",
      "app/api/messages/[id]/route.ts",
      "app/api/messages/[id]/report/route.ts",
      "app/api/messages/[id]/photo/route.ts",
      "app/api/notifications/route.ts",
      "app/api/inbox/badge/route.ts",
    ];
    for (const relative of files) {
      const src = readFileSync(join(process.cwd(), relative), "utf8");
      expect(src).toContain("requireCookieOrBearerApiAuth");
      expect(src).toContain("requireCookieOrBearerApiAuth(request)");
      expect(src).not.toContain("requireApiAuth(");
    }
  });

  it("forces authenticated Inbox GET routes dynamic and private no-store", () => {
    const files = [
      "app/api/messages/route.ts",
      "app/api/messages/[id]/route.ts",
      "app/api/notifications/route.ts",
      "app/api/inbox/badge/route.ts",
    ];
    for (const relative of files) {
      const src = readFileSync(join(process.cwd(), relative), "utf8");
      expect(src).toContain('export const dynamic = "force-dynamic"');
      expect(src).toContain("withPrivateNoStore");
    }
  });

  it("does not change Message Safety SSOT", () => {
    const store = readFileSync(join(process.cwd(), "lib/messages/store.ts"), "utf8");
    const security = readFileSync(join(process.cwd(), "lib/messages/security.ts"), "utf8");
    expect(store).toContain("inspectMessageContent");
    expect(security).toContain("analyzeMessageContent");
    expect(security).toContain("export function inspectMessageContent");
  });

  it("GET Inbox list/detail reuse authenticated auth.supabase like badge", () => {
    const messages = readFileSync(join(process.cwd(), "app/api/messages/route.ts"), "utf8");
    const detail = readFileSync(join(process.cwd(), "app/api/messages/[id]/route.ts"), "utf8");
    const notifications = readFileSync(join(process.cwd(), "app/api/notifications/route.ts"), "utf8");
    const store = readFileSync(join(process.cwd(), "lib/messages/store.ts"), "utf8");
    const notificationStore = readFileSync(join(process.cwd(), "lib/notifications/store.ts"), "utf8");
    expect(messages).toContain("listConversations(auth.user.id, auth.supabase)");
    expect(messages).toContain("syncConversationOpen");
    expect(messages).toContain('source: "messages_tab"');
    expect(detail).toContain("getConversationById(id, auth.user.id, auth.supabase)");
    expect(detail).toContain("client: auth.supabase");
    expect(detail).toContain("senderId: auth.user.id");
    expect(notifications).toContain("listNotifications(auth.user.id, auth.supabase)");
    expect(store).toContain("const supabase = client ?? (await createClient());");
    expect(notificationStore).toContain("const supabase = client ?? (await createClient());");
    expect(store).not.toContain("createVerifiedBearerUserClient");
    expect(notificationStore).not.toContain("createVerifiedBearerUserClient");
    const patch = readFileSync(join(process.cwd(), "app/api/messages/[id]/route.ts"), "utf8")
      .split("export async function PATCH")[1]
      ?.split("export async function DELETE")[0];
    expect(patch).toContain("getConversationById(id, auth.user.id, auth.supabase)");
    const photo = readFileSync(join(process.cwd(), "app/api/messages/[id]/photo/route.ts"), "utf8");
    expect(photo).toContain("client: auth.supabase");
    expect(photo).toContain("getViewerRole");
    expect(photo).toContain("uploadMessageImage(id, file, auth.supabase)");
    const offers = readFileSync(join(process.cwd(), "app/api/offers/route.ts"), "utf8");
    expect(offers).toContain("requireCookieOrBearerApiAuth");
    expect(offers).not.toContain("Offer must be below the listing price.");
  });
});

describe("Messages CSRF cookie vs Bearer", () => {
  it("cookie mutations without Origin stay protected", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");
    const blocked = await validateMutationOrigin(
      new Request(DETAIL_URL, {
        method: "POST",
        headers: { host: "www.rovexo.co.uk" },
      }),
    );
    expect(blocked?.status).toBe(403);
    vi.unstubAllEnvs();
  });

  it("verified Bearer mutations do not require browser Origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    expect(
      await validateMutationOrigin(bearerRequest(DETAIL_URL, "POST", "valid-native-jwt", { content: "hi", kind: "text" })),
    ).toBeNull();
    vi.unstubAllEnvs();
  });
});

describe("Messages / Inbox cookie and Bearer handlers", () => {
  beforeEach(() => {
    verifyBearerAccessToken.mockReset();
    createVerifiedBearerUserClient.mockReset();
    requireApiAuth.mockReset();
    listConversations.mockReset();
    findOrCreateConversation.mockReset();
    getConversationById.mockReset();
    appendMessage.mockReset();
    updateConversationPreferences.mockReset();
    syncConversationOpen.mockReset();
    listNotifications.mockReset();
    markNotificationsRead.mockReset();
    getUnreadNotificationCount.mockReset();
    createContentReport.mockReset();
    createAdminClient.mockReset();
    enforceRateLimit.mockReset();
    enforceRateLimitForUser.mockReset();
    uploadMessageImage.mockReset();
    createVerifiedBearerUserClient.mockReturnValue(badgeClient());
    requireApiAuth.mockResolvedValue(cookieAuth());
    enforceRateLimit.mockResolvedValue(null);
    enforceRateLimitForUser.mockResolvedValue(null);
    listConversations.mockResolvedValue([{ id: CONV_ID }]);
    findOrCreateConversation.mockResolvedValue({ conversationId: CONV_ID });
    getConversationById.mockImplementation(async (_id: string, viewerId: string) =>
      viewerId === USER_ID ? conversation(viewerId) : null,
    );
    appendMessage.mockResolvedValue({ message: { id: "msg-1" }, warning: null });
    updateConversationPreferences.mockResolvedValue(undefined);
    syncConversationOpen.mockResolvedValue({ ok: true });
    uploadMessageImage.mockResolvedValue({ path: `${CONV_ID}/photo.jpg`, publicUrl: "https://cdn.example/photo.jpg" });
    listNotifications.mockImplementation(async (userId: string) =>
      userId === USER_ID ? [{ id: "n1", userId: USER_ID }] : [{ id: "n-other", userId }],
    );
    markNotificationsRead.mockResolvedValue(undefined);
    getUnreadNotificationCount.mockResolvedValue(2);
    createContentReport.mockResolvedValue(undefined);
    createAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "conversations") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: CONV_ID, buyer_id: USER_ID, seller_id: USER_B },
                }),
              }),
            }),
          };
        }
        if (table === "conversation_reports") {
          return { insert: async () => ({ error: null }) };
        }
        throw new Error(`unexpected table ${table}`);
      },
    });
  });

  it("GET /api/messages with valid cookie lists that user's conversations", async () => {
    const response = await getMessages(cookieRequest(MESSAGES_URL, "GET"));
    expect(response.status).toBe(200);
    expect(requireApiAuth).toHaveBeenCalled();
    expect(verifyBearerAccessToken).not.toHaveBeenCalled();
    expect(listConversations).toHaveBeenCalledWith(USER_ID, expect.anything());
    const body = await response.json();
    expect(body.conversations).toEqual([{ id: CONV_ID }]);
  });

  it("GET /api/messages with valid Bearer lists that user's conversations", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await getMessages(bearerRequest(MESSAGES_URL, "GET", "valid-native-jwt"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(requireApiAuth).not.toHaveBeenCalled();
    expect(listConversations).toHaveBeenCalledWith(USER_ID, expect.anything());
  });

  it("GET /api/messages without auth is 401", async () => {
    requireApiAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const response = await getMessages(new Request(MESSAGES_URL, { method: "GET" }));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("GET /api/messages invalid Bearer is 401 and does not fall through to cookies", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const response = await getMessages(bearerRequest(MESSAGES_URL, "GET", "expired-native-jwt"));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(requireApiAuth).not.toHaveBeenCalled();
    expect(listConversations).not.toHaveBeenCalled();
  });

  it("GET /api/messages/{id} valid Bearer returns the conversation", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await getDetail(bearerRequest(DETAIL_URL, "GET", "valid-native-jwt"), detailContext);
    expect(response.status).toBe(200);
    expect(getConversationById).toHaveBeenCalledWith(CONV_ID, USER_ID, expect.anything());
    const body = await response.json();
    expect(body.conversation.id).toBe(CONV_ID);
  });

  it("GET /api/messages/{id} unauthorized user is 404", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser(USER_B));
    createVerifiedBearerUserClient.mockReturnValue(badgeClient());
    const response = await getDetail(bearerRequest(DETAIL_URL, "GET", "other-user-jwt"), detailContext);
    expect(response.status).toBe(404);
    expect(getConversationById).toHaveBeenCalledWith(CONV_ID, USER_B, expect.anything());
  });

  it("POST /api/messages/{id} valid Bearer sends with existing store behaviour", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await postDetail(
      bearerRequest(DETAIL_URL, "POST", "valid-native-jwt", { content: "Hello", kind: "text" }),
      detailContext,
    );
    expect(response.status).toBe(200);
    expect(getConversationById).toHaveBeenCalledWith(CONV_ID, USER_ID, expect.anything());
    expect(appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: CONV_ID,
        senderId: USER_ID,
        content: "Hello",
        kind: "text",
        client: expect.anything(),
      }),
    );
  });

  it("POST /api/messages/{id} invalid Bearer is 401", async () => {
    verifyBearerAccessToken.mockResolvedValue(null);
    const response = await postDetail(
      bearerRequest(DETAIL_URL, "POST", "expired-native-jwt", { content: "Hello", kind: "text" }),
      detailContext,
    );
    expect(response.status).toBe(401);
    expect(appendMessage).not.toHaveBeenCalled();
  });

  it("GET /api/notifications valid Bearer returns that user's notifications only", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await getNotifications(bearerRequest(NOTIFICATIONS_URL, "GET", "valid-native-jwt"));
    expect(response.status).toBe(200);
    expect(listNotifications).toHaveBeenCalledWith(USER_ID, expect.anything());
    expect(listNotifications).not.toHaveBeenCalledWith(USER_B);
  });

  it("PATCH /api/notifications valid Bearer marks read for authenticated user only", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await patchNotifications(
      bearerRequest(NOTIFICATIONS_URL, "PATCH", "valid-native-jwt", { ids: ["n1"], read: true }),
    );
    expect(response.status).toBe(200);
    expect(markNotificationsRead).toHaveBeenCalledWith(USER_ID, ["n1"]);
  });

  it("GET /api/inbox/badge valid Bearer returns counts", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await getBadge(bearerRequest(BADGE_URL, "GET", "valid-native-jwt"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.messages).toBe(2);
    expect(body.notifications).toBe(2);
    expect(body.inboxBadge).toBe(4);
    expect(getUnreadNotificationCount).toHaveBeenCalledWith(USER_ID, expect.anything());
  });

  it("GET /api/inbox/badge valid cookie still works", async () => {
    const response = await getBadge(cookieRequest(BADGE_URL, "GET"));
    expect(response.status).toBe(200);
    expect(requireApiAuth).toHaveBeenCalled();
  });

  it("POST report valid Bearer enforces conversation membership", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await postReport(
      bearerRequest(REPORT_URL, "POST", "valid-native-jwt", { reason: "spam" }),
      detailContext,
    );
    expect(response.status).toBe(200);
    expect(createContentReport).toHaveBeenCalledWith(
      expect.objectContaining({ reporterId: USER_ID, targetId: CONV_ID }),
    );
  });

  it("POST report Bearer outsider is 403", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser(USER_B));
    createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: CONV_ID, buyer_id: USER_ID, seller_id: "33333333-3333-4333-8333-333333333333" },
            }),
          }),
        }),
      }),
    });
    const response = await postReport(
      bearerRequest(REPORT_URL, "POST", "outsider-jwt", { reason: "spam" }),
      detailContext,
    );
    expect(response.status).toBe(403);
    expect(createContentReport).not.toHaveBeenCalled();
  });

  it("PATCH /api/messages markAllRead valid Bearer uses Inbox Event Engine", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    listConversations
      .mockResolvedValueOnce([{ id: CONV_ID, unreadCount: 2 }])
      .mockResolvedValueOnce([{ id: CONV_ID, unreadCount: 0 }]);
    syncConversationOpen.mockResolvedValue({ ok: true });
    const response = await patchMessages(
      bearerRequest(MESSAGES_URL, "PATCH", "valid-native-jwt", { markAllRead: true }),
    );
    expect(response.status).toBe(200);
    expect(syncConversationOpen).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: CONV_ID, viewerId: USER_ID, source: "messages_tab" }),
    );
  });

  it("PATCH /api/messages/{id} read valid Bearer uses auth.supabase", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await patchDetail(
      bearerRequest(DETAIL_URL, "PATCH", "valid-native-jwt", { action: "read", source: "hub_mount" }),
      detailContext,
    );
    expect(response.status).toBe(200);
    expect(getConversationById).toHaveBeenCalledWith(CONV_ID, USER_ID, expect.anything());
    expect(syncConversationOpen).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: CONV_ID, viewerId: USER_ID }),
    );
  });

  it("POST /api/messages/{id}/photo valid Bearer uploads via existing store", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const form = new FormData();
    form.append("file", new File([new Uint8Array([0xff, 0xd8, 0xff])], "message.jpg", { type: "image/jpeg" }));
    const response = await postPhoto(
      new Request(PHOTO_URL, {
        method: "POST",
        headers: {
          host: "www.rovexo.co.uk",
          authorization: "Bearer valid-native-jwt",
        },
        body: form,
      }),
      detailContext,
    );
    expect(response.status).toBe(200);
    expect(uploadMessageImage).toHaveBeenCalledWith(CONV_ID, expect.any(File), expect.anything());
    expect(appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: CONV_ID,
        senderId: USER_ID,
        kind: "photo",
        client: expect.anything(),
      }),
    );
    expect(getConversationById).toHaveBeenCalledWith(CONV_ID, USER_ID, expect.anything());
  });

  it("POST /api/messages/{id}/photo ignores spoofed senderRole and uses viewer role", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const form = new FormData();
    form.append("file", new File([new Uint8Array([0xff, 0xd8, 0xff])], "message.jpg", { type: "image/jpeg" }));
    form.append("senderRole", "seller");
    const response = await postPhoto(
      new Request(PHOTO_URL, {
        method: "POST",
        headers: {
          host: "www.rovexo.co.uk",
          authorization: "Bearer valid-native-jwt",
        },
        body: form,
      }),
      detailContext,
    );
    expect(response.status).toBe(200);
    expect(appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: CONV_ID,
        senderId: USER_ID,
        senderRole: "buyer",
        kind: "photo",
        client: expect.anything(),
      }),
    );
    const photo = readFileSync(join(process.cwd(), "app/api/messages/[id]/photo/route.ts"), "utf8");
    expect(photo).not.toMatch(/formData\.get\(\s*["']senderRole["']/);
  });

  it("PATCH block valid Bearer updates preferences for authenticated viewer", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await patchDetail(
      bearerRequest(DETAIL_URL, "PATCH", "valid-native-jwt", { action: "block", value: true }),
      detailContext,
    );
    expect(response.status).toBe(200);
    expect(updateConversationPreferences).toHaveBeenCalledWith({
      conversationId: CONV_ID,
      viewerId: USER_ID,
      patch: { blocked: true },
    });
  });

  it("DELETE conversation valid Bearer archives for authenticated viewer", async () => {
    verifyBearerAccessToken.mockResolvedValue(nativeUser());
    const response = await deleteDetail(bearerRequest(DETAIL_URL, "DELETE", "valid-native-jwt"), detailContext);
    expect(response.status).toBe(200);
    expect(updateConversationPreferences).toHaveBeenCalledWith({
      conversationId: CONV_ID,
      viewerId: USER_ID,
      patch: { archived: true },
    });
  });

  it("POST /api/messages hub cookie still authenticates", async () => {
    const response = await postMessages(
      cookieRequest(MESSAGES_URL, "POST", { productSlug: "navy-coat" }),
    );
    expect(response.status).toBe(200);
    expect(requireApiAuth).toHaveBeenCalled();
    expect(findOrCreateConversation).toHaveBeenCalledWith({
      buyerId: USER_ID,
      productSlug: "navy-coat",
    });
  });
});
