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

  return ScoutFactsSchema.parse({
    url: args.url,
    title,
    prizeText: extractPrizeText(pageText),
    tracks: findKnownItems(pageText, KNOWN_TRACKS).map(normalizeDashTrack),
    requirements: findKnownItems(pageText, KNOWN_REQUIREMENTS),
    judgingCriteria: findKnownItems(pageText, KNOWN_JUDGING),
    builderProfile: args.builderProfile,
    constraints: args.constraints,
    sourceAvailable: args.html.trim().length > 0
  });
}

export function buildFallbackFacts(url: string, builderProfile: string, constraints: string[]): ScoutFacts {
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
