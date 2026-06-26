import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { extractFactsFromHtml } from "../../src/scout/extract.js";
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
});
