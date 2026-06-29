import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CATEGORY_DETECTION_DEBOUNCE_MS,
  createDebouncedCategoryDetection,
} from "@/lib/sell/category-detection-scheduler";
import {
  createTitleIdleScheduler,
  TITLE_IDLE_COMMIT_MS,
} from "@/lib/sell/title-idle-scheduler";
import { sellBackgroundPolicy } from "@/lib/sell/sell-background-policy";
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
  it("uses an 800ms debounce window for background category work", () => {
    expect(CATEGORY_DETECTION_DEBOUNCE_MS).toBe(800);
    expect(TITLE_IDLE_COMMIT_MS).toBe(800);
  });
});

describe("sell background policy launch blocker", () => {
  it("keeps AI, category suggestion, and geolocation off until re-enabled", () => {
    expect(sellBackgroundPolicy.photoAiEnabled).toBe(false);
    expect(sellBackgroundPolicy.categorySuggestEnabled).toBe(false);
    expect(sellBackgroundPolicy.autoLocationEnabled).toBe(false);
  });
});

describe("title idle commit scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not commit title while the user is still typing", () => {
    const commit = vi.fn();
    let title = "";
    const scheduler = createTitleIdleScheduler((next) => commit(next), () => title, 800);

    for (let index = 0; index < 120; index += 1) {
      title = "x".repeat(index + 1);
      scheduler.touch();
      vi.advanceTimersByTime(50);
    }

    expect(commit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(800);
    vi.runAllTimers();

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith("x".repeat(120));
  });
});
