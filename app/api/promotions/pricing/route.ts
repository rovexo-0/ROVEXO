import { NextResponse } from "next/server";
import {
  getMarketplacePricingSettings,
  marketplacePricingToBumpOptions,
  marketplacePricingToFeatureOptions,
} from "@/lib/promotions/marketplace-pricing";

export async function GET() {
  const settings = await getMarketplacePricingSettings();
  return NextResponse.json({
    settings,
    boost: marketplacePricingToBumpOptions(settings),
    showcase: marketplacePricingToFeatureOptions(settings),
  });
}
