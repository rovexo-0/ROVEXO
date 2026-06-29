import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CATEGORY_DETECTION_DEBOUNCE_MS,
  createDebouncedCategoryDetection,
} from "@/lib/sell/category-detection-scheduler";
import * as categoryDetectionPro from "@/lib/sell/category-detection-pro";
import {
  clampListingTitle,
  LISTING_TITLE_MAX,
} from "@/lib/sell/listing-title";

describe("title input freeze regression", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("clamps pasted title input to 120 characters", () => {
    const pasted = "x".repeat(200);
    expect(clampListingTitle(pasted)).toHaveLength(LISTING_TITLE_MAX);
  });

  it("debounces category detection and defers work off the input path", () => {
    const detectSpy = vi.spyOn(categoryDetectionPro, "detectCategoryFromTitle").mockReturnValue({
      suggestions: [],
      top: null,
      tier: "none",
    });
    const run = vi.fn();
    const scheduler = createDebouncedCategoryDetection(run, CATEGORY_DETECTION_DEBOUNCE_MS);

    for (let index = 0; index < 120; index += 1) {
      scheduler.schedule();
      vi.advanceTimersByTime(10);
    }

    expect(detectSpy).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();

    vi.advanceTimersByTime(CATEGORY_DETECTION_DEBOUNCE_MS);
    expect(run).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(0);
    expect(detectSpy).not.toHaveBeenCalled();
  });

  it("coalesces rapid title commits into one debounced detection run", () => {
    const run = vi.fn();
    const scheduler = createDebouncedCategoryDetection(run, CATEGORY_DETECTION_DEBOUNCE_MS);

    for (let index = 0; index < 120; index += 1) {
      scheduler.schedule();
    }

    vi.advanceTimersByTime(CATEGORY_DETECTION_DEBOUNCE_MS);
    vi.runAllTimers();

    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe("category detection debounce constants", () => {
  it("uses a debounce window within the 500–800ms requirement", () => {
    expect(CATEGORY_DETECTION_DEBOUNCE_MS).toBeGreaterThanOrEqual(500);
    expect(CATEGORY_DETECTION_DEBOUNCE_MS).toBeLessThanOrEqual(800);
  });
});
