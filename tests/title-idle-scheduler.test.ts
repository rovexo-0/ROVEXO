import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createTitleIdleScheduler } from "@/lib/sell/title-idle-scheduler";
import { createDebouncedCategoryDetection } from "@/lib/sell/category-detection-scheduler";

describe("createTitleIdleScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("commits after idle delay", () => {
    const onCommit = vi.fn();
    const readTitle = vi.fn(() => "Nike trainers");
    const scheduler = createTitleIdleScheduler(onCommit, readTitle, 800);

    scheduler.touch();
    expect(onCommit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(799);
    expect(onCommit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onCommit).toHaveBeenCalledWith("Nike trainers");
  });

  it("resets timer on repeated touch", () => {
    const onCommit = vi.fn();
    const scheduler = createTitleIdleScheduler(onCommit, () => "a", 800);

    scheduler.touch();
    vi.advanceTimersByTime(500);
    scheduler.touch();
    vi.advanceTimersByTime(500);
    expect(onCommit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("flush commits immediately", () => {
    const onCommit = vi.fn();
    const scheduler = createTitleIdleScheduler(onCommit, () => "done", 800);

    scheduler.touch();
    scheduler.flush();
    expect(onCommit).toHaveBeenCalledWith("done");
  });
});

describe("createDebouncedCategoryDetection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs detection after debounce", () => {
    const run = vi.fn();
    const detection = createDebouncedCategoryDetection(run, 800);

    detection.schedule();
    vi.advanceTimersByTime(800);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
