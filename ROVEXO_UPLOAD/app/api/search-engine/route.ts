import { NextResponse } from "next/server";
import {
  getPublicSearchEngineConfig,
  getSearchEngineAnalytics,
  getSearchEngineContext,
} from "@/lib/search-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const [config, context, analytics] = await Promise.all([
    getPublicSearchEngineConfig(),
    getSearchEngineContext(),
    getSearchEngineAnalytics(),
  ]);

  return NextResponse.json({ config, context, analytics });
}
