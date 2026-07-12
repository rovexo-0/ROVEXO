import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { createNewListingSession } from "@/lib/sell/new-listing-session";

describe("new listing session", () => {
  it("returns a completely empty draft", async () => {
    const draft = createEmptyDraft();
    draft.title = "Old listing";
    draft.brand = "Nike";
    const session = await createNewListingSession(draft, "new-session-id");
    expect(session.draft.title).toBe("");
    expect(session.draft.brand).toBe("");
    expect(session.draft.photos).toEqual([]);
    expect(session.draft.userModified).toEqual({});
    expect(session.uploadSessionId).toBe("new-session-id");
  });
});
