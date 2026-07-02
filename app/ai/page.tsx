import { Suspense } from "react";
import { AiEngineHub } from "@/features/ai-engine/AiEngineHub";
import { AI_ENGINE_MODULES } from "@/lib/ai-engine/registry";
import {
  getAiEngineAnalyticsForUser,
  getAiEngineContext,
  getPublicAiEngineConfig,
} from "@/lib/ai-engine/reader";
import { getProfile } from "@/lib/profile/data";

export default async function AiRoute() {
  const profile = await getProfile();
  const [config, context, analytics] = await Promise.all([
    getPublicAiEngineConfig(),
    getAiEngineContext(profile.id),
    getAiEngineAnalyticsForUser(profile.id),
  ]);

  return (
    <Suspense fallback={<div className="aie-hub p-ds-5">Loading AI…</div>}>
      <AiEngineHub
        config={config}
        context={context}
        modules={AI_ENGINE_MODULES}
        analytics={analytics}
      />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "AI | ROVEXO",
    description: "ROVEXO AI Engine — optional intelligence, automation, and provider orchestration.",
    robots: { index: false, follow: false },
  };
}
