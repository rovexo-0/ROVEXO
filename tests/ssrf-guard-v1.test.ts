import { describe, expect, it } from "vitest";
import {
  assertSafeOutboundUrl,
  assertSafeOutboundUrlSync,
  isBlockedIpAddress,
  SsrfBlockedError,
} from "@/lib/security/ssrf-guard-v1";
import { isValidImageUrl } from "@/lib/seller/migration/images/downloader";

describe("ssrf-guard-v1", () => {
  it("blocks localhost and loopback", () => {
    expect(() => assertSafeOutboundUrlSync("http://127.0.0.1/x", { allowHttp: true })).toThrow(
      SsrfBlockedError,
    );
    expect(() => assertSafeOutboundUrlSync("http://localhost/x", { allowHttp: true })).toThrow(
      SsrfBlockedError,
    );
    expect(() => assertSafeOutboundUrlSync("http://[::1]/x", { allowHttp: true })).toThrow(
      SsrfBlockedError,
    );
  });

  it("blocks private ranges and metadata", () => {
    expect(isBlockedIpAddress("10.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("172.16.5.1")).toBe(true);
    expect(isBlockedIpAddress("192.168.1.1")).toBe(true);
    expect(isBlockedIpAddress("169.254.169.254")).toBe(true);
    expect(isBlockedIpAddress("0.0.0.0")).toBe(true);
    expect(() =>
      assertSafeOutboundUrlSync("http://169.254.169.254/latest/meta-data/", { allowHttp: true }),
    ).toThrow(SsrfBlockedError);
  });

  it("blocks unsupported protocols", () => {
    expect(() => assertSafeOutboundUrlSync("file:///etc/passwd")).toThrow(SsrfBlockedError);
    expect(() => assertSafeOutboundUrlSync("ftp://example.com/a")).toThrow(SsrfBlockedError);
    expect(() => assertSafeOutboundUrlSync("gopher://example.com/1")).toThrow(SsrfBlockedError);
  });

  it("blocks internal DNS suffixes", () => {
    expect(() => assertSafeOutboundUrlSync("https://db.internal/x")).toThrow(SsrfBlockedError);
    expect(() => assertSafeOutboundUrlSync("https://svc.local/x")).toThrow(SsrfBlockedError);
  });

  it("allows public https hosts", () => {
    const url = assertSafeOutboundUrlSync("https://images.example.com/a.jpg");
    expect(url.hostname).toBe("images.example.com");
  });

  it("enforces allowlists", () => {
    expect(() =>
      assertSafeOutboundUrlSync("https://evil.example/label.pdf", {
        allowedHostSuffixes: ["sendcloud.sc"],
      }),
    ).toThrow(SsrfBlockedError);
    expect(
      assertSafeOutboundUrlSync("https://panel.sendcloud.sc/label.pdf", {
        allowedHostSuffixes: ["sendcloud.sc"],
      }).hostname,
    ).toBe("panel.sendcloud.sc");
  });

  it("rejects DNS that resolves to private addresses", async () => {
    await expect(assertSafeOutboundUrl("http://127.0.0.1/", { allowHttp: true })).rejects.toBeInstanceOf(
      SsrfBlockedError,
    );
  });

  it("isValidImageUrl uses SSRF guard", () => {
    expect(isValidImageUrl("https://cdn.example.com/a.jpg")).toBe(true);
    expect(isValidImageUrl("http://127.0.0.1/a.jpg")).toBe(false);
    expect(isValidImageUrl("file:///tmp/a.jpg")).toBe(false);
  });
});
