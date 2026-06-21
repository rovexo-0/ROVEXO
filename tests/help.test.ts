import { describe, expect, it } from "vitest";
import { answerHelpQuestion } from "@/lib/help/assistant";
import { getHelpArticle } from "@/lib/help/content/articles";
import { searchHelpArticles } from "@/lib/help/search";

describe("help centre", () => {
  it("finds articles by keyword search", () => {
    const results = searchHelpArticles("refund");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.article.slug).toBe("payments-refunds");
  });

  it("returns official article content only", () => {
    const article = getHelpArticle("terms-of-service");
    expect(article?.title).toContain("Terms");
  });

  it("does not hallucinate when no article matches", () => {
    const response = answerHelpQuestion("zzzznotarealtopic12345");
    expect(response.matched).toBe(false);
    expect(response.suggestSupport).toBe(true);
  });

  it("answers from help articles when matched", () => {
    const response = answerHelpQuestion("buyer protection");
    expect(response.matched).toBe(true);
    expect(response.articles[0]?.article.slug).toBe("buying-buyer-protection");
  });
});
