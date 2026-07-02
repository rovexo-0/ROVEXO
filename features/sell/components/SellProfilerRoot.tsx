"use client";

import { Profiler, useEffect, type ProfilerOnRenderCallback, type ReactNode } from "react";
import { initSellProfiler, sellProfileRender } from "@/lib/sell/sell-profiler";

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  sellProfileRender(id, {
    phase,
    actualDuration: Math.round(actualDuration * 100) / 100,
    baseDuration: Math.round(baseDuration * 100) / 100,
    startTime: Math.round(startTime),
    commitTime: Math.round(commitTime),
  });
};

export function SellProfilerRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    initSellProfiler();
  }, []);

  return (
    <Profiler id="SellPage" onRender={onRender}>
      {children}
    </Profiler>
  );
}
