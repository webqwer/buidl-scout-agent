import OpenAI from "openai";
import { ScoutReportSchema, type ScoutReport } from "../domain/types.js";

type RefineOptions = {
  apiKey?: string;
  model?: string;
};

export async function maybeRefineReport(report: ScoutReport, options: RefineOptions = {}): Promise<ScoutReport> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return report;

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.5",
    instructions: [
      "You refine BUIDL Scout Agent reports.",
      "Return only JSON matching the provided report schema.",
      "Preserve decision, score, tracks, risks, checklist, and sources unless wording clarity requires minor edits."
    ].join(" "),
    input: JSON.stringify(report)
  });

  const raw = response.output_text;
  if (!raw) return report;

  try {
    return ScoutReportSchema.parse(JSON.parse(raw));
  } catch {
    return report;
  }
}
