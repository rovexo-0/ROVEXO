import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeCommandOsAction, getCommandOsSnapshot, searchCommandOs } from "@/lib/command-os-v4";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.string().min(1),
  query: z.string().optional(),
  historyId: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("search");

  if (searchQuery) {
    return NextResponse.json({ ok: true, results: searchCommandOs(searchQuery, 40) });
  }

  const snapshot = await getCommandOsSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());
    const result = await executeCommandOsAction(body.action, {
      query: body.query,
      historyId: body.historyId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid Command OS action payload." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Command OS action failed." }, { status: 500 });
  }
}
