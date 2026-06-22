import { describe, expect, it } from "vitest";
import { answerHelpQuestion } from "@/lib/help/assistant";
import { getHelpArticle } from "@/lib/help/content/articles";
import { getHelpTopic, HELP_TOPICS } from "@/lib/help/content/topics";
import { getDecisionTree } from "@/lib/help/decision-trees/registry";
import { resolveDecisionOption } from "@/lib/help/decision-trees/engine";
import { detectHelpIntent } from "@/lib/help/intents";
import { searchHelpCentre } from "@/lib/help/search";

describe("enterprise help center", () => {
  it("exposes all main help topic categories", () => {
    expect(HELP_TOPICS.length).toBeGreaterThanOrEqual(40);
    for (const slug of ["withdraw", "buyer", "seller", "stripe", "orders", "shipping", "reports"]) {
      expect(getHelpTopic(slug)?.slug).toBe(slug);
    }
  });

  it("opens categories with decision trees instead of articles only", () => {
    const withdrawTree = getDecisionTree("withdraw");
    expect(withdrawTree?.rootNodeId).toBe("root");
    expect(Object.keys(withdrawTree?.nodes ?? {}).length).toBeGreaterThan(3);
    expect(Object.keys(withdrawTree?.solutions ?? {}).length).toBeGreaterThan(5);
  });

  it("finds articles, topics, and FAQs in global search", () => {
    const refundResults = searchHelpCentre("refund");
    expect(refundResults.some((result) => result.type === "article")).toBe(true);
    expect(refundResults.some((result) => result.type === "topic")).toBe(true);

    const withdrawResults = searchHelpCentre("withdraw processing");
    expect(withdrawResults.length).toBeGreaterThan(0);
  });

  it("routes AI assistant withdraw questions to guided troubleshooting", () => {
    const intent = detectHelpIntent("I can't withdraw my money");
    expect(intent?.topicSlug).toBe("withdraw");

    const response = answerHelpQuestion("I can't withdraw my money");
    expect(response.matched).toBe(true);
    expect(response.suggestTree).toBe(true);
    expect(response.guideHref).toBe("/help/category/withdraw");
  });

  it("resolves withdraw processing time from the decision tree", () => {
    const tree = getDecisionTree("withdraw");
    expect(tree).not.toBeNull();
    const resolved = resolveDecisionOption(tree!, "root", "processing");
    expect(resolved.solution?.title).toContain("Withdrawal processing");
    expect(resolved.solution?.estimatedReviewTime).toContain("24");
  });

  it("returns official article content only", () => {
    const article = getHelpArticle("terms-of-service");
    expect(article?.title).toContain("Terms");
  });

  it("does not hallucinate when no match exists", () => {
    const response = answerHelpQuestion("zzzznotarealtopic12345");
    expect(response.matched).toBe(false);
    expect(response.suggestSupport).toBe(true);
  });
});
