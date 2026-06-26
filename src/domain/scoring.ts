import { ScoutFactsSchema, ScoutReportSchema, type ScoutFacts, type ScoutReport, type ScoutRisk } from "./types.js";

const CROO_TRACKS = new Set([
  "Research & Intelligence Agents",
  "Developer Tooling Agents",
  "Data & Verification Agents",
  "Open - Any A2A Agents"
]);

export function buildScoutReport(input: ScoutFacts): ScoutReport {
  const facts = ScoutFactsSchema.parse(input);
  const matchedTracks = facts.tracks.filter((track) => CROO_TRACKS.has(track));
  const lowerRequirements = facts.requirements.join(" ").toLowerCase();
  const lowerJudging = facts.judgingCriteria.join(" ").toLowerCase();
  const lowerProfile = facts.builderProfile.toLowerCase();

  let score = facts.sourceAvailable ? 45 : 25;
  score += matchedTracks.length * 12;
  if (lowerRequirements.includes("cap")) score += 12;
  if (lowerRequirements.includes("open source")) score += 8;
  if (lowerRequirements.includes("demo")) score += 6;
  if (lowerJudging.includes("technical")) score += 5;
  if (lowerJudging.includes("a2a")) score += 5;
  if (lowerProfile.includes("typescript") || lowerProfile.includes("node")) score += 4;
  if (lowerProfile.includes("openai") || lowerProfile.includes("ai")) score += 3;
  if (facts.constraints.some((constraint) => constraint.toLowerCase().includes("low infrastructure"))) score += 3;

  score = Math.max(0, Math.min(100, score));
  const decision = score >= 80 ? "go" : score >= 60 ? "consider" : "no-go";
  const risks = buildRisks(facts);
  const effortDays = estimateEffortDays(facts);

  return ScoutReportSchema.parse({
    decision,
    score,
    summary: summarizeDecision(decision, facts, score),
    effort: {
      days: effortDays,
      confidence: facts.sourceAvailable && matchedTracks.length > 0 ? "medium" : "low",
      drivers: buildEffortDrivers(facts)
    },
    tracks: matchedTracks.length > 0 ? matchedTracks : facts.tracks,
    risks,
    checklist: buildChecklist(facts),
    sources: [{ title: facts.title, url: facts.url }]
  });
}

function buildRisks(facts: ScoutFacts): ScoutRisk[] {
  const risks: ScoutRisk[] = [];
  const requirementText = facts.requirements.join(" ").toLowerCase();

  if (!facts.sourceAvailable) {
    risks.push({
      level: "high",
      title: "Source unavailable",
      mitigation: "Re-run the scout with page HTML or verify requirements manually before committing."
    });
  }

  if (requirementText.includes("cap")) {
    risks.push({
      level: "high",
      title: "External account setup",
      mitigation: "Register the CROO Agent Store service and API key before recording the final demo."
    });
  }

  if (requirementText.includes("demo")) {
    risks.push({
      level: "medium",
      title: "Demo clarity",
      mitigation: "Record a five-minute flow showing input, paid order handling, and delivered report output."
    });
  }

  return risks;
}

function estimateEffortDays(facts: ScoutFacts): number {
  let days = 4;
  if (facts.requirements.join(" ").toLowerCase().includes("cap")) days += 2;
  if (facts.requirements.join(" ").toLowerCase().includes("demo")) days += 1;
  if (facts.tracks.length > 1) days += 1;
  if (!facts.sourceAvailable) days += 2;
  return days;
}

function buildEffortDrivers(facts: ScoutFacts): string[] {
  const drivers = ["Core report generation"];
  const requirementText = facts.requirements.join(" ").toLowerCase();
  if (requirementText.includes("cap")) drivers.push("CAP provider integration");
  if (requirementText.includes("open source")) drivers.push("Repository and license polish");
  if (requirementText.includes("demo")) drivers.push("Demo recording and submission narrative");
  if (!facts.sourceAvailable) drivers.push("Manual source verification");
  return drivers;
}

function buildChecklist(facts: ScoutFacts): string[] {
  const checklist = [
    "Confirm official deadline and judging criteria",
    "Build a narrow agent service with schema output",
    "Register and list the agent on CROO Agent Store",
    "Run a paid order through CAP and save evidence",
    "Publish a public GitHub repository with a permissive license",
    "Record a demo video under five minutes",
    "Submit the BUIDL on DoraHacks with repo and video links"
  ];

  if (!facts.sourceAvailable) {
    checklist.unshift("Manually verify source page details before submitting");
  }

  return checklist;
}

function summarizeDecision(decision: ScoutReport["decision"], facts: ScoutFacts, score: number): string {
  if (decision === "go") {
    return `${facts.title} is a strong fit with a ${score}/100 score because the requirements align with callable, paid, composable agent delivery.`;
  }

  if (decision === "consider") {
    return `${facts.title} is viable but needs careful scope control before committing.`;
  }

  return `${facts.title} is not recommended until the source, requirements, or builder fit become clearer.`;
}
