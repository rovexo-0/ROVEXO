import { describe, expect, it } from "vitest";
import {
  isChunkLoadFailure,
  isDevRuntimeHost,
  isTurbopackHmrChunkFailure,
  isWithinRecoveryCooldown,
  shouldAutoRecoverChunkFailure,
  CHUNK_RECOVER_COOLDOWN_MS,
} from "@/lib/runtime/chunk-load-recovery-guard-v1";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("P3.1 chunk-load recovery guard", () => {
  it("detects ChunkLoadError shapes", () => {
    expect(isChunkLoadFailure(new Error("ChunkLoadError: Failed to load chunk"))).toBe(true);
    expect(isChunkLoadFailure({ name: "ChunkLoadError", message: "Failed to load chunk /x.js" })).toBe(
      true,
    );
    expect(isChunkLoadFailure(new Error("TypeError: boom"))).toBe(false);
  });

  it("classifies Turbopack HMR client failures", () => {
    expect(
      isTurbopackHmrChunkFailure(
        "ChunkLoadError: Failed to load chunk /_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_1mojsay._.js",
      ),
    ).toBe(true);
    expect(
      isTurbopackHmrChunkFailure("ChunkLoadError: Failed to load chunk /_next/static/chunks/app_sell_page.js"),
    ).toBe(false);
  });

  it("skips auto-recovery for HMR races on localhost/LAN only", () => {
    const hmr =
      "ChunkLoadError: Failed to load chunk /_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_1mojsay._.js";
    expect(shouldAutoRecoverChunkFailure(hmr, "localhost")).toBe(false);
    expect(shouldAutoRecoverChunkFailure(hmr, "192.168.1.20")).toBe(false);
    expect(shouldAutoRecoverChunkFailure(hmr, "www.rovexo.co.uk")).toBe(true);

    const appChunk = "ChunkLoadError: Failed to load chunk /_next/static/chunks/app_platform_sell.js";
    expect(shouldAutoRecoverChunkFailure(appChunk, "localhost")).toBe(true);
  });

  it("matches SW-style private LAN host detection", () => {
    expect(isDevRuntimeHost("localhost")).toBe(true);
    expect(isDevRuntimeHost("172.24.10.5")).toBe(true);
    expect(isDevRuntimeHost("www.rovexo.co.uk")).toBe(false);
  });

  it("enforces recovery cooldown including legacy flag", () => {
    const now = 1_000_000;
    expect(isWithinRecoveryCooldown("1", now)).toBe(true);
    expect(isWithinRecoveryCooldown(String(now - 1_000), now)).toBe(true);
    expect(isWithinRecoveryCooldown(String(now - CHUNK_RECOVER_COOLDOWN_MS - 1), now)).toBe(false);
    expect(isWithinRecoveryCooldown(null, now)).toBe(false);
  });

  it("keeps bootstrap script synchronized with guard constants", () => {
    const bootstrap = readFileSync(
      join(process.cwd(), "components/runtime/chunk-load-bootstrap.ts"),
      "utf8",
    );
    expect(bootstrap).toContain('PARAM="rx_chunk"');
    expect(bootstrap).toContain('KEY="rovexo_chunk_load_recovery_v1"');
    expect(bootstrap).toContain('LOCK="__rovexoChunkRecoveryLock"');
    expect(bootstrap).toContain("COOLDOWN=120000");
    expect(bootstrap).toContain("isHmr");
    expect(bootstrap).toContain("isDevHost");
    expect(bootstrap).toContain("window[LOCK]=true");
  });
});
