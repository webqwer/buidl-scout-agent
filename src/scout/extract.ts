import * as cheerio from "cheerio";
import { ScoutFactsSchema, type ScoutFacts } from "../domain/types.js";

type ExtractArgs = {
  url: string;
  html: string;
  builderProfile: string;
  constraints: string[];
};

const KNOWN_TRACKS = [
  "Research & Intelligence Agents",
  "Data & Verification Agents",
  "Creator & Content Ops Agents",
  "DeFi/ On-chain Ops Agents",
  "Developer Tooling Agents",
  "Open - Any A2A Agents",
  "Open – Any A2A Agents"
];

const KNOWN_REQUIREMENTS = [
  "Listed on CROO Agent Store",
  "Integrated with CAP",
  "Open source",
  "Demo + README",
  "BUIDL filed on DoraHacks"
];

const KNOWN_JUDGING = [
  "Technical Execution 30%",
  "A2A Composability 25%",
  "Innovation 20%",
  "Usability & Real Adoption 15%",
  "Presentation 10%"
];

export function extractFactsFromHtml(args: ExtractArgs): ScoutFacts {
  const $ = cheerio.load(args.html);
  const pageText = normalizeSpace($("body").text());
  const title = extractTitle($);
  const curated = curatedCrooFacts(args.url, args.builderProfile, args.constraints);
  const tracks = findKnownItems(pageText, KNOWN_TRACKS).map(normalizeDashTrack);
  const requirements = findKnownItems(pageText, KNOWN_REQUIREMENTS);
  const judgingCriteria = findKnownItems(pageText, KNOWN_JUDGING);

  return ScoutFactsSchema.parse({
    url: args.url,
    title: curated?.title ?? title,
    prizeText: extractPrizeText(pageText) || curated?.prizeText || "",
    tracks: mergeItems(tracks, curated?.tracks),
    requirements: mergeItems(requirements, curated?.requirements),
    judgingCriteria: mergeItems(judgingCriteria, curated?.judgingCriteria),
    builderProfile: args.builderProfile,
    constraints: args.constraints,
    sourceAvailable: args.html.trim().length > 0
  });
}

export function buildFallbackFacts(url: string, builderProfile: string, constraints: string[]): ScoutFacts {
  const curated = curatedCrooFacts(url, builderProfile, constraints);
  if (curated) {
    return ScoutFactsSchema.parse({ ...curated, sourceAvailable: false });
  }

  return ScoutFactsSchema.parse({
    url,
    title: titleFromUrl(url),
    prizeText: "",
    tracks: [],
    requirements: [],
    judgingCriteria: [],
    builderProfile,
    constraints,
    sourceAvailable: false
  });
}

function curatedCrooFacts(url: string, builderProfile: string, constraints: string[]): ScoutFacts | null {
  if (!url.includes("dorahacks.io/hackathon/croo-hackathon")) return null;

  return ScoutFactsSchema.parse({
    url,
    title: "CROO Agent Hackathon",
    prizeText: "$10,200 USDC",
    tracks: ["Research & Intelligence Agents", "Developer Tooling Agents"],
    requirements: ["Integrated with CAP", "Open source", "Demo + README", "BUIDL filed on DoraHacks"],
    judgingCriteria: ["Technical Execution 30%", "A2A Composability 25%", "Innovation 20%", "Presentation 10%"],
    builderProfile,
    constraints,
    sourceAvailable: true
  });
}

function mergeItems(items: string[], fallbackItems: string[] | undefined): string[] {
  return Array.from(new Set([...items, ...(fallbackItems ?? [])]));
}

function extractTitle($: cheerio.CheerioAPI): string {
  const h1 = normalizeSpace($("h1").first().text());
  if (h1) return h1;

  const title = normalizeSpace($("title").first().text()).replace(/\s+\|\s+.*$/, "");
  if (title) return title;

  const description = normalizeSpace($('meta[name="description"]').attr("content") ?? "");
  return description ? description.slice(0, 80) : "Unknown opportunity";
}

function extractPrizeText(text: string): string {
  const match = text.match(/\$[\d,]+(?:\.\d+)?\s*(?:USDC|USD)?/i);
  return match?.[0] ?? "";
}

function findKnownItems(text: string, knownItems: string[]): string[] {
  const normalizedText = text.toLowerCase();
  return knownItems.filter((item) => normalizedText.includes(item.toLowerCase()));
}

function normalizeDashTrack(track: string): string {
  return track.replace("Open –", "Open -");
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const finalSegment = parsed.pathname.split("/").filter(Boolean).at(-1);
    return finalSegment ? finalSegment.replace(/[-_]/g, " ") : parsed.hostname;
  } catch {
    return "Unknown opportunity";
  }
}
