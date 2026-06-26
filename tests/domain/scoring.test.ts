import { describe, expect, it } from "vitest";
import { buildScoutReport } from "../../src/domain/scoring.js";

describe("buildScoutReport", () => {
  it("recommends go for a strong CROO-style hackathon fit", () => {
    const report = buildScoutReport({
      url: "https://dorahacks.io/hackathon/croo-hackathon",
      title: "CROO Agent Hackathon",
      prizeText: "$10,200 USDC",
      tracks: ["Research & Intelligence Agents", "Developer Tooling Agents"],
      requirements: ["CAP integration", "Open source", "Demo video"],
      judgingCriteria: ["Technical Execution 30%", "A2A Composability 25%"],
      builderProfile: "solo TypeScript/OpenAI builder, 2 weeks available",
      constraints: ["prefer low infrastructure cost"],
      sourceAvailable: true
    });

    expect(report.decision).toBe("go");
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.tracks).toContain("Research & Intelligence Agents");
    expect(report.checklist).toContain("Register and list the agent on CROO Agent Store");
  });

  it("adds a source unavailable risk when content cannot be fetched", () => {
    const report = buildScoutReport({
      url: "https://example.invalid/bounty",
      title: "Unknown opportunity",
      prizeText: "",
      tracks: [],
      requirements: [],
      judgingCriteria: [],
      builderProfile: "solo builder",
      constraints: [],
      sourceAvailable: false
    });

    expect(report.risks.some((risk) => risk.title === "Source unavailable")).toBe(true);
    expect(report.score).toBeLessThan(70);
  });

  it("still recommends go for curated CROO facts when live fetch is unavailable", () => {
    const report = buildScoutReport({
      url: "https://dorahacks.io/hackathon/croo-hackathon",
      title: "CROO Agent Hackathon",
      prizeText: "$10,200 USDC",
      tracks: ["Research & Intelligence Agents", "Developer Tooling Agents"],
      requirements: ["Integrated with CAP", "Open source", "Demo + README"],
      judgingCriteria: ["Technical Execution 30%", "A2A Composability 25%"],
      builderProfile: "solo TypeScript builder",
      constraints: [],
      sourceAvailable: false
    });

    expect(report.decision).toBe("go");
    expect(report.risks.some((risk) => risk.title === "Source unavailable")).toBe(true);
  });
});
