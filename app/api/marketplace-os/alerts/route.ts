import { buildMosControlCenterSnapshot } from "@/lib/marketplace-os/dashboard";

export async function GET() {
  const snapshot = await buildMosControlCenterSnapshot();
  return Response.json({ alerts: snapshot.alerts });
}
