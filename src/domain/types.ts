import { z } from "zod";

export const RiskLevelSchema = z.enum(["low", "medium", "high"]);

export const ScoutInputSchema = z.object({
  url: z.string().url(),
  builderProfile: z.string().min(1).default("solo builder"),
  constraints: z.array(z.string().min(1)).default([]),
  html: z.string().optional(),
  useOpenAI: z.boolean().default(false)
});

export const ScoutFactsSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  prizeText: z.string().default(""),
  tracks: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  judgingCriteria: z.array(z.string()).default([]),
  builderProfile: z.string().min(1),
  constraints: z.array(z.string()).default([]),
  sourceAvailable: z.boolean().default(true)
});

export const ScoutRiskSchema = z.object({
  level: RiskLevelSchema,
  title: z.string().min(1),
  mitigation: z.string().min(1)
});

export const ScoutReportSchema = z.object({
  decision: z.enum(["go", "consider", "no-go"]),
  score: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  effort: z.object({
    days: z.number().int().min(1),
    confidence: z.enum(["low", "medium", "high"]),
    drivers: z.array(z.string()).default([])
  }),
  tracks: z.array(z.string()).default([]),
  risks: z.array(ScoutRiskSchema).default([]),
  checklist: z.array(z.string()).default([]),
  sources: z.array(
    z.object({
      title: z.string().min(1),
      url: z.string().url()
    })
  ).default([])
});

export type ScoutInput = z.input<typeof ScoutInputSchema>;
export type ScoutFacts = z.infer<typeof ScoutFactsSchema>;
export type ScoutRisk = z.infer<typeof ScoutRiskSchema>;
export type ScoutReport = z.infer<typeof ScoutReportSchema>;
