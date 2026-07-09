import { NextResponse } from "next/server";
import { z } from "zod";
import { askMarketplaceAssistant, inferAssistantPersona } from "@/lib/ai-assistant/marketplace";
import { getAuthContext } from "@/lib/auth/session";
import { ROVEXO_ACCOUNT_KIND } from "@/lib/profile/account";
import { getUserSubscription, userHasPremiumFeature } from "@/lib/monetization/service";

const schema = z.object({
  query: z.string().min(1).max(2000),
  pathname: z.string().optional(),
  persona: z.enum(["buyer", "seller", "business", "wholesale", "admin"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const auth = await getAuthContext();
    const pathname = body.pathname ?? "/";
    const persona = body.persona ?? inferAssistantPersona(pathname, auth ? ROVEXO_ACCOUNT_KIND : undefined);
    const subscription = auth ? await getUserSubscription(auth.user.id) : null;
    const premiumAi = userHasPremiumFeature(subscription, "premium_ai");

    const response = askMarketplaceAssistant(body.query, {
      pathname,
      persona,
      userId: auth?.user.id,
      accountType: auth ? ROVEXO_ACCOUNT_KIND : undefined,
      premiumAi,
    });

    return NextResponse.json({ success: true, response });
  } catch {
    return NextResponse.json({ error: "Invalid assistant request." }, { status: 400 });
  }
}
