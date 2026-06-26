import { buildScoutReport } from "../domain/scoring.js";
import { ScoutInputSchema, type ScoutInput, type ScoutReport } from "../domain/types.js";
import { buildFallbackFacts, extractFactsFromHtml } from "./extract.js";

export async function createScoutReport(input: ScoutInput): Promise<ScoutReport> {
  const parsed = ScoutInputSchema.parse(input);
  const htmlResult = parsed.html === undefined ? await fetchHtml(parsed.url) : { ok: true as const, html: parsed.html };

  const facts = htmlResult.ok
    ? extractFactsFromHtml({
        url: parsed.url,
        html: htmlResult.html,
        builderProfile: parsed.builderProfile,
        constraints: parsed.constraints
      })
    : buildFallbackFacts(parsed.url, parsed.builderProfile, parsed.constraints);

  return buildScoutReport(facts);
}

export function formatReportAsMarkdown(report: ScoutReport): string {
  const risks = report.risks.length
    ? report.risks.map((risk) => `- **${risk.level.toUpperCase()}** ${risk.title}: ${risk.mitigation}`)
    : ["- No major risks identified."];

  return [
    "# BUIDL Scout Report",
    "",
    `Decision: ${report.decision.toUpperCase()}`,
    `Score: ${report.score}`,
    "",
    "## Summary",
    report.summary,
    "",
    "## Effort",
    `Estimated days: ${report.effort.days}`,
    `Confidence: ${report.effort.confidence}`,
    ...report.effort.drivers.map((driver) => `- ${driver}`),
    "",
    "## Tracks",
    ...(report.tracks.length ? report.tracks.map((track) => `- ${track}`) : ["- No clear track match found."]),
    "",
    "## Risks",
    ...risks,
    "",
    "## Checklist",
    ...report.checklist.map((item) => `- ${item}`),
    "",
    "## Sources",
    ...report.sources.map((source) => `- [${source.title}](${source.url})`)
  ].join("\n");
}

async function fetchHtml(url: string): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "BUIDL Scout Agent/0.1"
      }
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    return { ok: true, html: await response.text() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown fetch error" };
  }
}
