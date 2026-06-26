import { describe, expect, it } from "vitest";
import { maybeRefineReport } from "../../src/llm/openaiRefiner.js";

describe("maybeRefineReport", () => {
  it("returns the original report when no API key is configured", async () => {
    const report = {
      decision: "go" as const,
      score: 82,
      summary: "Strong fit.",
      effort: { days: 7, confidence: "medium" as const, drivers: ["CAP"] },
      tracks: ["Developer Tooling Agents"],
      risks: [],
      checklist: ["Register CROO Agent"],
      sources: []
    };

    await expect(maybeRefineReport(report, { apiKey: "" })).resolves.toEqual(report);
  });
});
