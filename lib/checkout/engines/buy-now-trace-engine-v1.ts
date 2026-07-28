/**
 * BUY NOW TRACE ENGINE v1.0 — Cod Sânge Priority 1
 *
 * localhost:3000 evidence only. Logs STEP → START → PASS/FAIL → code → reason → file → line → next.
 * Does NOT change buyer/seller/listing/payment/order/self-purchase security gates.
 * On FAIL: stop recording further steps; print blocking failure only.
 */

export type BuyNowTraceStatus = "START" | "PASS" | "FAIL";

export type BuyNowTraceStepRecord = {
  step: string;
  status: BuyNowTraceStatus;
  code: string | null;
  reason: string | null;
  file: string;
  line: number;
  next: string | null;
  at: string;
};

export type BuyNowTraceBlockingFailure = {
  functionName: string;
  realFailureReason: string;
  fileName: string;
  lineNumber: number;
  rootCause: string;
  code: string | null;
};

const ENGINE_FILE = "lib/checkout/engines/buy-now-engine-v1.ts";

let lastTrace: BuyNowTraceEngine | null = null;

function registerLastBuyNowTrace(engine: BuyNowTraceEngine): void {
  lastTrace = engine;
}

export function getLastBuyNowTrace(): BuyNowTraceEngine | null {
  return lastTrace;
}

export class BuyNowTraceEngine {
  readonly runId: string;
  private readonly steps: BuyNowTraceStepRecord[] = [];
  private blocked: BuyNowTraceBlockingFailure | null = null;

  constructor(runId = `bn_trace_${Date.now()}`) {
    this.runId = runId;
    registerLastBuyNowTrace(this);
  }

  getSteps(): readonly BuyNowTraceStepRecord[] {
    return this.steps;
  }

  getBlockingFailure(): BuyNowTraceBlockingFailure | null {
    return this.blocked;
  }

  start(step: string, file: string, line: number, next: string | null): void {
    if (this.blocked) return;
    this.push({
      step,
      status: "START",
      code: null,
      reason: null,
      file,
      line,
      next,
    });
    this.printStep(this.steps[this.steps.length - 1]!);
  }

  pass(step: string, file: string, line: number, next: string | null): void {
    if (this.blocked) return;
    this.push({
      step,
      status: "PASS",
      code: null,
      reason: null,
      file,
      line,
      next,
    });
    this.printStep(this.steps[this.steps.length - 1]!);
  }

  /**
   * Record FAIL, print blocking evidence, and stop. Does not alter security decisions.
   */
  fail(input: {
    step: string;
    code: string;
    reason: string;
    file: string;
    line: number;
    next?: string | null;
    rootCause: string;
  }): BuyNowTraceBlockingFailure {
    if (this.blocked) return this.blocked;
    this.push({
      step: input.step,
      status: "FAIL",
      code: input.code,
      reason: input.reason,
      file: input.file,
      line: input.line,
      next: input.next ?? null,
    });
    this.printStep(this.steps[this.steps.length - 1]!);
    this.blocked = {
      functionName: input.step,
      realFailureReason: input.reason,
      fileName: input.file,
      lineNumber: input.line,
      rootCause: input.rootCause,
      code: input.code,
    };
    this.printBlockingFailure(this.blocked);
    return this.blocked;
  }

  private push(
    partial: Omit<BuyNowTraceStepRecord, "at"> & { at?: string },
  ): void {
    this.steps.push({
      ...partial,
      at: partial.at ?? new Date().toISOString(),
    });
  }

  private printStep(step: BuyNowTraceStepRecord): void {
    // Server evidence only — never user UI.
    console.info(
      [
        "[BUY_NOW_TRACE]",
        this.runId,
        step.step,
        step.status,
        step.code ?? "-",
        step.reason ?? "-",
        `${step.file}:${step.line}`,
        step.next ?? "-",
      ].join(" | "),
    );
  }

  private printBlockingFailure(failure: BuyNowTraceBlockingFailure): void {
    console.info("[BUY_NOW_TRACE] ========== BLOCKING FAILURE ==========");
    console.info(`[BUY_NOW_TRACE] 1. FUNCTION NAME: ${failure.functionName}`);
    console.info(`[BUY_NOW_TRACE] 2. REAL FAILURE REASON: ${failure.realFailureReason}`);
    console.info(`[BUY_NOW_TRACE] 3. FILE NAME: ${failure.fileName}`);
    console.info(`[BUY_NOW_TRACE] 4. LINE NUMBER: ${failure.lineNumber}`);
    console.info(`[BUY_NOW_TRACE] 5. ROOT CAUSE: ${failure.rootCause}`);
    console.info("[BUY_NOW_TRACE] ========================================");
  }
}

export const BUY_NOW_TRACE_ENGINE_FILE = ENGINE_FILE;
