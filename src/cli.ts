import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createScoutReport, formatReportAsMarkdown } from "./scout/report.js";

type CliOptions = {
  url?: string;
  profile: string;
  constraints: string[];
  format: "json" | "markdown";
};

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.url) {
    throw new Error("Missing required --url <hackathon-or-bounty-url>");
  }

  const report = await createScoutReport({
    url: options.url,
    builderProfile: options.profile,
    constraints: options.constraints
  });

  const output = options.format === "json" ? JSON.stringify(report, null, 2) : formatReportAsMarkdown(report);
  process.stdout.write(`${output}\n`);
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    profile: "solo builder",
    constraints: [],
    format: "markdown"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--url" && next) {
      options.url = next;
      index += 1;
    } else if (arg === "--profile" && next) {
      options.profile = next;
      index += 1;
    } else if (arg === "--constraint" && next) {
      options.constraints.push(next);
      index += 1;
    } else if (arg === "--format" && (next === "json" || next === "markdown")) {
      options.format = next;
      index += 1;
    }
  }

  return options;
}

export function isDirectRun(moduleUrl: string, argvPath: string | undefined): boolean {
  if (!argvPath) return false;
  return resolve(fileURLToPath(moduleUrl)) === resolve(argvPath);
}

if (isDirectRun(import.meta.url, process.argv[1])) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown CLI error";
    process.stderr.write(`BUIDL Scout failed: ${message}\n`);
    process.exitCode = 1;
  });
}
