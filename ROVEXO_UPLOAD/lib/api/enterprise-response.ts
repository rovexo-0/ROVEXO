import { NextResponse } from "next/server";

const APP_VERSION = process.env.npm_package_version ?? "0.1.0";

export function getRequestCorrelationId(request?: Request): string {
  if (request) {
    const fromHeader = request.headers.get("x-request-id") ?? request.headers.get("x-correlation-id");
    if (fromHeader?.trim()) return fromHeader.trim();
  }
  return crypto.randomUUID();
}

export type EnterpriseSuccessBody<T> = {
  success: true;
  timestamp: string;
  version: string;
  requestId: string;
  data: T;
  diagnostics: Record<string, unknown>;
};

export type EnterpriseErrorBody = {
  success: false;
  timestamp: string;
  version: string;
  requestId: string;
  error: string;
  diagnostics: Record<string, unknown>;
};

export function enterpriseSuccessResponse<T>(
  data: T,
  input?: {
    request?: Request;
    status?: number;
    diagnostics?: Record<string, unknown>;
    startedAt?: number;
  },
): NextResponse<EnterpriseSuccessBody<T>> {
  const requestId = getRequestCorrelationId(input?.request);
  const executionTimeMs = input?.startedAt ? Date.now() - input.startedAt : undefined;

  return NextResponse.json(
    {
      success: true as const,
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      requestId,
      data,
      diagnostics: {
        ...(executionTimeMs !== undefined ? { executionTimeMs } : {}),
        ...(input?.diagnostics ?? {}),
      },
    },
    {
      status: input?.status ?? 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}

export function enterpriseErrorResponse(
  error: string,
  input?: {
    request?: Request;
    status?: number;
    diagnostics?: Record<string, unknown>;
    startedAt?: number;
  },
): NextResponse<EnterpriseErrorBody> {
  const requestId = getRequestCorrelationId(input?.request);
  const executionTimeMs = input?.startedAt ? Date.now() - input.startedAt : undefined;

  return NextResponse.json(
    {
      success: false as const,
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      requestId,
      error,
      diagnostics: {
        ...(executionTimeMs !== undefined ? { executionTimeMs } : {}),
        ...(input?.diagnostics ?? {}),
      },
    },
    {
      status: input?.status ?? 500,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}

export async function parseJsonBody<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    const text = await request.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
