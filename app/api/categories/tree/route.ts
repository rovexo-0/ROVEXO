import { NextResponse } from "next/server";
import { getCategoryTree } from "@/lib/categories/queries";

export async function GET() {
  return NextResponse.json({ tree: getCategoryTree() });
}
