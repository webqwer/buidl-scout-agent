import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { buildFallbackFacts, extractFactsFromHtml } from "../../src/scout/extract.js";
import { createScoutReport } from "../../src/scout/report.js";

describe("scout report generation", () => {
  it("extracts CROO event facts from HTML", async () => {
    const html = await readFile("tests/fixtures/croo-hackathon.html", "utf8");
    const facts = extractFactsFromHtml({
      url: "https://dorahacks.io/hackathon/croo-hackathon",
      html,
      builderProfile: "solo TypeScript builder",
      constraints: ["ship fast"]
    });

    expect(facts.title).toBe("CROO Agent Hackathon");
    expect(facts.tracks).toContain("Developer Tooling Agents");
    expect(facts.requirements).toContain("Integrated with CAP");
  });

  it("creates a schema-valid report from supplied HTML", async () => {
    const html = await readFile("tests/fixtures/croo-hackathon.html", "utf8");
    const report = await createScoutReport({
      url: "https://dorahacks.io/hackathon/croo-hackathon",
      builderProfile: "solo TypeScript builder",
      constraints: ["ship fast"],
      html
    });

    expect(report.decision).toBe("go");
    expect(report.sources[0]?.url).toBe("https://dorahacks.io/hackathon/croo-hackathon");
  });

  it("uses curated CROO facts when the official event page cannot be fetched", () => {
    const facts = buildFallbackFacts("https://dorahacks.io/hackathon/croo-hackathon", "solo TypeScript builder", []);

    expect(facts.title).toBe("CROO Agent Hackathon");
    expect(facts.tracks).toContain("Research & Intelligence Agents");
    expect(facts.requirements).toContain("Integrated with CAP");
    expect(facts.sourceAvailable).toBe(false);
  });
});
