import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getTrackingUrl } from "@/lib/orders/status";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const ROYAL_MAIL_TRACKING = "MZ539415387GB";
const EVRI_TRACKING = "H01XTA0004974486";
const ROYAL_MAIL_URL = `https://www.royalmail.com/track-your-item#/tracking-results/${ROYAL_MAIL_TRACKING}`;
const EVRI_URL = `https://www.evri.com/track-a-parcel/${EVRI_TRACKING}`;

describe("TRACK PARCEL carrier routing — getTrackingUrl SSOT", () => {
  it("Royal Mail never builds an Evri destination", () => {
    const url = getTrackingUrl("Royal Mail", ROYAL_MAIL_TRACKING);
    expect(url).toBe(ROYAL_MAIL_URL);
    expect(url).not.toContain("evri.com");
    expect(url).not.toContain("track-a-parcel");
  });

  it("Evri never builds a Royal Mail destination", () => {
    const url = getTrackingUrl("Evri", EVRI_TRACKING);
    expect(url).toBe(EVRI_URL);
    expect(url).not.toContain("royalmail.com");
    expect(url).not.toContain("track-your-item");
  });
});

describe("TRACK PARCEL ConversationHub wiring", () => {
  const hub = readSource("features/inbox/components/ConversationHub.tsx");
  const card = readSource("features/inbox/components/TransactionStatusCard.tsx");
  const resolver = readSource("lib/inbox/transaction-status-card-v1.ts");

  it("reuses getTrackingUrl and removes the hardcoded Evri URL", () => {
    expect(hub).toContain('from "@/lib/orders/status"');
    expect(hub).toContain("getTrackingUrl");
    expect(hub).toContain("const trackingUrl = getTrackingUrl(carrier, trackingNumber)");
    expect(hub).toContain("window.location.assign(trackingUrl)");
    expect(hub).not.toContain("EVRI_PUBLIC_TRACK_PARCEL_URL");
    expect(hub).not.toContain("https://www.evri.com/track-a-parcel");
    expect(hub).not.toContain("https://www.royalmail.com/track-your-item");
  });

  it("missing tracking fail-closes: toast then return, no redirect", () => {
    const trackBlock = hub.slice(
      hub.indexOf('if (actionId === "track_parcel")'),
      hub.indexOf('if (actionId === "buy_now"'),
    );
    expect(trackBlock).toContain(
      'title: "Tracking will appear once the carrier scans your parcel."',
    );
    expect(trackBlock).toMatch(
      /if \(!trackingNumber\) \{[\s\S]*pushToast\([\s\S]*return;/,
    );
    const toastReturnAt = trackBlock.indexOf("return;");
    const assignAt = trackBlock.indexOf("window.location.assign(trackingUrl)");
    expect(toastReturnAt).toBeGreaterThan(-1);
    expect(assignAt).toBeGreaterThan(toastReturnAt);
  });

  it("does not create a second tracking URL builder or /tracking page", () => {
    expect(hub).not.toContain("function getTrackingUrl");
    expect(hub).not.toContain("/tracking");
    expect(hub).not.toContain("sendcloud");
    expect(card).toContain('onClick={() => onAction(primaryAction.id)}');
    expect(resolver).toContain('label: "TRACK PARCEL"');
  });
});
