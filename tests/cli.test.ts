import { describe, expect, it } from "vitest";
import { isDirectRun } from "../src/cli.js";
import { formatReportAsMarkdown } from "../src/scout/report.js";

describe("CLI formatting", () => {
  it("renders report markdown with score, risks, and checklist", () => {
    const markdown = formatReportAsMarkdown({
      decision: "go",
      score: 86,
      summary: "Strong fit.",
      effort: { days: 8, confidence: "medium", drivers: ["CAP onboarding"] },
      tracks: ["Developer Tooling Agents"],
      risks: [{ level: "high", title: "External setup", mitigation: "Do it early." }],
      checklist: ["Register CROO Agent"],
      sources: [{ title: "CROO Agent Hackathon", url: "https://dorahacks.io/hackathon/croo-hackathon" }]
    });

    expect(markdown).toContain("# BUIDL Scout Report");
    expect(markdown).toContain("Score: 86");
    expect(markdown).toContain("Register CROO Agent");
  });

  it("recognizes a Windows path as a direct CLI run", () => {
    expect(isDirectRun("file:///D:/xxzl/buidl-scout-agent/src/cli.ts", "D:\\xxzl\\buidl-scout-agent\\src\\cli.ts")).toBe(true);
  });
});
