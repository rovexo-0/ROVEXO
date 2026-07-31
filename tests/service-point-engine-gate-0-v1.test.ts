import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  SERVICE_POINT_ENGINE_V1,
  isServicePointEngineEnabled,
  servicePointEngineDisabledBody,
} from "@/lib/shipping/service-point-engine-v1";
import { isCheckoutCollectionPointEnabled } from "@/lib/checkout/delivery-capabilities-v1";

describe("Service Point Engine v1.0 — Gate 0", () => {
  it("defaults SERVICE_POINT_ENGINE_ENABLED to false", () => {
    expect(isServicePointEngineEnabled({})).toBe(false);
    expect(isServicePointEngineEnabled({ SERVICE_POINT_ENGINE_ENABLED: "" })).toBe(false);
    expect(isServicePointEngineEnabled({ SERVICE_POINT_ENGINE_ENABLED: "0" })).toBe(false);
    expect(isServicePointEngineEnabled({ SERVICE_POINT_ENGINE_ENABLED: "false" })).toBe(false);
    expect(isServicePointEngineEnabled({ SERVICE_POINT_ENGINE_ENABLED: "1" })).toBe(true);
    expect(isServicePointEngineEnabled({ SERVICE_POINT_ENGINE_ENABLED: "true" })).toBe(true);
  });

  it("fail-closed body matches Gate 0 contract", () => {
    expect(servicePointEngineDisabledBody()).toEqual({
      feature: "service_points",
      status: "disabled",
      reason: "Sendcloud API integration not certified",
    });
    expect(SERVICE_POINT_ENGINE_V1.envKey).toBe("SERVICE_POINT_ENGINE_ENABLED");
  });

  it("hides Checkout Collection Point / Service Point while Gate 0 is closed", () => {
    expect(isCheckoutCollectionPointEnabled()).toBe(false);
  });

  it("wires fail-closed Service Point routes", () => {
    const list = join(process.cwd(), "app/api/shipping/service-points/route.ts");
    const select = join(process.cwd(), "app/api/shipping/service-points/select/route.ts");
    expect(existsSync(list)).toBe(true);
    expect(existsSync(select)).toBe(true);
    expect(readFileSync(list, "utf8")).toContain("servicePointEngineDisabledResponse");
    expect(readFileSync(select, "utf8")).toContain("servicePointEngineDisabledResponse");
  });

  it("documents Gate 0–5 master spec", () => {
    const spec = join(process.cwd(), "docs/engineering/SERVICE_POINT_ENGINE_MASTER_SPEC.md");
    expect(existsSync(spec)).toBe(true);
    const text = readFileSync(spec, "utf8");
    expect(text).toContain("Gate 0");
    expect(text).toContain("Gate 5");
    expect(text).toContain("SERVICE_POINT_ENGINE_ENABLED");
  });

  it("quote engine excludes service_point_input required while Gate 0 closed", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/shipping/sendcloud/service.ts"),
      "utf8",
    );
    expect(source).toContain("isServicePointEngineEnabled");
    expect(source).toContain('service_point_input === "required"');
  });
});
