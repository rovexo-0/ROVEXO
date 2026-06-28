import type { DeploymentAiInsight, DeploymentBuild, PlatformRelease } from "@/lib/enterprise-deployment-center/types";
import { DEPLOYMENT_AI_PREDICTION_TYPES } from "@/lib/enterprise-deployment-center/registry";
import { validationScore } from "@/lib/enterprise-deployment-center/builds";
import { validateRelease } from "@/lib/enterprise-deployment-center/validation";

export function generateDeploymentAiInsights(
  releases: PlatformRelease[],
  builds: DeploymentBuild[],
): DeploymentAiInsight[] {
  const latestBuild = builds[0];
  const latestRelease = releases[0];
  const buildScore = latestBuild ? validationScore(latestBuild) : 70;

  return DEPLOYMENT_AI_PREDICTION_TYPES.map((type, i) => {
    let score = 75 + (i % 5) * 4;
    let summary = `${type.replace(/-/g, " ")} within acceptable range`;
    let recommendation: string | undefined;

    if (type === "risk-score" && latestRelease) {
      const validation = validateRelease(latestRelease, latestBuild);
      score = validation.score;
      summary = `Release risk score: ${score}%`;
    }
    if (type === "rollback-recommendation" && buildScore < 80) {
      recommendation = "Consider delaying deployment until build validation passes";
      score = 35;
    }
    if (type === "deployment-recommendation" && buildScore >= 90) {
      recommendation = "Safe to proceed with canary deployment";
      score = 92;
    }

    return { id: `ai-${type}`, type, score, summary, recommendation };
  });
}

export function computeOverallRiskScore(insights: DeploymentAiInsight[]): number {
  const risk = insights.find((i) => i.type === "risk-score");
  if (risk) return risk.score;
  if (insights.length === 0) return 0;
  return Math.round(insights.reduce((s, i) => s + i.score, 0) / insights.length);
}

export function shouldRecommendRollback(insights: DeploymentAiInsight[]): boolean {
  return insights.some((i) => i.type === "rollback-recommendation" && i.score < 50);
}
