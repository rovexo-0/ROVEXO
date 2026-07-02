import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { CompletionStatus, CompletionValidationItem } from "@/lib/enterprise-marketplace-completion-engine/types";

export function passStatus(): CompletionStatus {
  return "pass";
}

export function labelize(value: string): string {
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function fileExists(relativePath: string): boolean {
  return existsSync(path.join(process.cwd(), relativePath));
}

export function readSource(relativePath: string): string {
  try {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
  } catch {
    return "";
  }
}

export function createCheck(category: string, check: string, pass: boolean, message: string): CompletionValidationItem {
  return {
    id: `${category}-${check}`,
    check,
    label: labelize(check),
    category,
    status: pass ? passStatus() : "fail",
    findings: pass ? 0 : 1,
    message,
    lastValidatedAt: new Date().toISOString(),
  };
}

export function premiumStylesActive(): boolean {
  return (
    fileExists("styles/rovexo/index.css") &&
    fileExists("styles/rovexo/category-rail.css") &&
    fileExists("styles/rovexo/hero.css")
  );
}
