import { buildZeroResultRecovery } from "@/lib/organic-growth/zero-results";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const count = Number(searchParams.get("count") ?? "0");

  const recovery = buildZeroResultRecovery(query, Number.isFinite(count) ? count : 0);
  return Response.json({ recovery });
}
