import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isLocalDevelopmentAppOrigin,
  resolveBusinessConnectAppBase,
} from "@/lib/business/business-connect-runtime-origin-v1";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Business Connect PWA runtime origin", () => {
  it("accepts loopback and LAN/dev hosts only", () => {
    expect(isLocalDevelopmentAppOrigin("http://localhost:3000")).toBe(true);
    expect(isLocalDevelopmentAppOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalDevelopmentAppOrigin("http://192.168.1.20:3000")).toBe(true);
    expect(isLocalDevelopmentAppOrigin("http://10.0.0.8:3000")).toBe(true);
    expect(isLocalDevelopmentAppOrigin("http://rovexo.local:3000")).toBe(true);
    expect(isLocalDevelopmentAppOrigin("https://www.rovexo.co.uk")).toBe(false);
    expect(isLocalDevelopmentAppOrigin("https://evil.example")).toBe(false);
  });

  it("uses the reachable request origin instead of Production", () => {
    expect(
      resolveBusinessConnectAppBase({
        originHeader: "http://192.168.1.20:3000",
        runtimeOrigin: "http://192.168.1.20:3000",
        fallbackBase: "https://www.rovexo.co.uk",
      }),
    ).toBe("http://192.168.1.20:3000");

    expect(
      resolveBusinessConnectAppBase({
        originHeader: "http://localhost:3000",
        fallbackBase: "https://www.rovexo.co.uk",
      }),
    ).toBe("http://localhost:3000");

    expect(
      resolveBusinessConnectAppBase({
        originHeader: "https://evil.example",
        runtimeOrigin: "https://evil.example",
        fallbackBase: "http://localhost:3000",
      }),
    ).toBe("http://localhost:3000");
  });

  it("Vercel Production ignores spoofed loopback/LAN Origin", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(
      resolveBusinessConnectAppBase({
        originHeader: "http://127.0.0.1:3000",
        refererHeader: "http://localhost:3000/business/connect",
        runtimeOrigin: "http://192.168.1.20:3000",
        fallbackBase: "https://www.rovexo.co.uk",
      }),
    ).toBe("https://www.rovexo.co.uk");
  });
});
