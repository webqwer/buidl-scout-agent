# BUIDL Scout Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested TypeScript CROO provider agent that evaluates hackathon/bounty links and produces structured go/no-go reports for DoraHacks submission.

**Architecture:** The core report generator is deterministic and independent of external credentials. Optional adapters wrap the core for OpenAI Responses API refinement and CROO CAP provider delivery. CLI and documentation provide a complete local demo path plus final submission materials.

**Tech Stack:** Node.js 18+, TypeScript, Vitest, Zod, Cheerio, OpenAI TypeScript SDK, CROO Node SDK, npm scripts.

---

## File Structure

- Create `package.json`: scripts, dependencies, package metadata.
- Create `tsconfig.json`: TypeScript compiler settings for ESM output.
- Create `vitest.config.ts`: Vitest test configuration.
- Create `.gitignore`: Node, build, coverage, and secret files.
- Create `.env.example`: documented runtime variables.
- Create `src/domain/types.ts`: Zod schemas and TypeScript types.
- Create `src/domain/scoring.ts`: scoring, effort, risks, and checklist rules.
- Create `src/scout/extract.ts`: HTML-to-facts extraction helpers.
- Create `src/scout/report.ts`: orchestrates validation, fetching, extraction, scoring, and formatting.
- Create `src/llm/openaiRefiner.ts`: optional OpenAI Responses API JSON refinement.
- Create `src/croo/provider.ts`: CROO provider event loop and delivery adapter.
- Create `src/cli.ts`: local demo CLI.
- Create `src/index.ts`: library exports.
- Create `tests/fixtures/croo-hackathon.html`: stable DoraHacks fixture.
- Create `tests/domain/scoring.test.ts`: scoring behavior tests.
- Create `tests/scout/report.test.ts`: fixture-based report tests.
- Create `tests/cli.test.ts`: CLI behavior tests.
- Create `tests/croo/provider.test.ts`: fake CROO client provider tests.
- Create `README.md`: setup, architecture, CROO steps, demo, SDK methods.
- Create `LICENSE`: MIT license.
- Create `submission/dorahacks.md`: final BUIDL submission draft.
- Create `submission/demo-script.md`: five-minute video script.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Write scaffold files**

`package.json`:

```json
{
  "name": "buidl-scout-agent",
  "version": "0.1.0",
  "description": "A CROO-compatible paid agent that evaluates hackathon and bounty links for builders.",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc -p tsconfig.json --noEmit",
    "scout": "tsx src/cli.ts",
    "provider": "tsx src/croo/provider.ts"
  },
  "dependencies": {
    "@croo-network/sdk": "^0.1.0",
    "cheerio": "^1.0.0",
    "openai": "^6.9.1",
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "vitest": "^4.0.15"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
```

`.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
npm-debug.log*
```

`.env.example`:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
CROO_API_URL=https://api.croo.network
CROO_WS_URL=wss://api.croo.network/ws
CROO_SDK_KEY=
CROO_TARGET_SERVICE_ID=
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: npm creates `package-lock.json` and installs dependencies.

- [ ] **Step 3: Run baseline tests**

Run: `npm test`

Expected: Vitest exits with no test files or no tests found only before tests exist. After tests are added, this command must pass.

- [ ] **Step 4: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore .env.example
git commit -m "chore: scaffold buidl scout agent"
```

### Task 2: Domain Models and Scoring

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/scoring.ts`
- Create: `tests/domain/scoring.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { buildScoutReport } from "../../src/domain/scoring.js";

describe("buildScoutReport", () => {
  it("recommends go for a strong CROO-style hackathon fit", () => {
    const report = buildScoutReport({
      url: "https://dorahacks.io/hackathon/croo-hackathon",
      title: "CROO Agent Hackathon",
      prizeText: "$10,200 USDC",
      tracks: ["Research & Intelligence Agents", "Developer Tooling Agents"],
      requirements: ["CAP integration", "Open source", "Demo video"],
      judgingCriteria: ["Technical Execution 30%", "A2A Composability 25%"],
      builderProfile: "solo TypeScript/OpenAI builder, 2 weeks available",
      constraints: ["prefer low infrastructure cost"],
      sourceAvailable: true
    });

    expect(report.decision).toBe("go");
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.tracks).toContain("Research & Intelligence Agents");
    expect(report.checklist).toContain("Register and list the agent on CROO Agent Store");
  });

  it("adds a source unavailable risk when content cannot be fetched", () => {
    const report = buildScoutReport({
      url: "https://example.invalid/bounty",
      title: "Unknown opportunity",
      prizeText: "",
      tracks: [],
      requirements: [],
      judgingCriteria: [],
      builderProfile: "solo builder",
      constraints: [],
      sourceAvailable: false
    });

    expect(report.risks.some((risk) => risk.title === "Source unavailable")).toBe(true);
    expect(report.score).toBeLessThan(70);
  });
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test -- tests/domain/scoring.test.ts`

Expected: FAIL because `src/domain/scoring.ts` does not exist.

- [ ] **Step 3: Implement schemas and scoring**

Implement `src/domain/types.ts` with `ScoutInputSchema`, `ScoutFactsSchema`, `ScoutReportSchema`, and exported types. Implement `src/domain/scoring.ts` with `buildScoutReport(facts)`.

- [ ] **Step 4: Run tests and verify green**

Run: `npm test -- tests/domain/scoring.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain tests/domain
git commit -m "feat: add scout scoring domain"
```

### Task 3: Source Extraction and Report Orchestration

**Files:**
- Create: `src/scout/extract.ts`
- Create: `src/scout/report.ts`
- Create: `tests/fixtures/croo-hackathon.html`
- Create: `tests/scout/report.test.ts`

- [ ] **Step 1: Write fixture and failing tests**

`tests/fixtures/croo-hackathon.html` should include the title, tracks, prize, requirements, and judging criteria copied from the live event page.

`tests/scout/report.test.ts`:

```ts
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
    expect(report.sources[0].url).toBe("https://dorahacks.io/hackathon/croo-hackathon");
  });
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test -- tests/scout/report.test.ts`

Expected: FAIL because scout modules do not exist.

- [ ] **Step 3: Implement extraction and orchestration**

`extractFactsFromHtml` uses Cheerio to read title/meta text and keyword matches. `createScoutReport` validates input, fetches HTML when not supplied, calls extraction, then calls `buildScoutReport`.

- [ ] **Step 4: Run tests and verify green**

Run: `npm test -- tests/scout/report.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scout tests/scout tests/fixtures
git commit -m "feat: generate scout reports from hackathon pages"
```

### Task 4: CLI and Markdown Output

**Files:**
- Create: `src/cli.ts`
- Modify: `src/scout/report.ts`
- Create: `tests/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

```ts
import { describe, expect, it } from "vitest";
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
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test -- tests/cli.test.ts`

Expected: FAIL because formatter is not exported.

- [ ] **Step 3: Implement formatter and CLI parser**

Add `formatReportAsMarkdown` and a simple CLI parser supporting `--url`, `--profile`, `--constraint`, and `--format json|markdown`.

- [ ] **Step 4: Run tests and CLI smoke command**

Run: `npm test -- tests/cli.test.ts`

Expected: PASS.

Run: `npm run scout -- --url https://dorahacks.io/hackathon/croo-hackathon --profile "solo TypeScript builder" --format markdown`

Expected: prints a Markdown report.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts src/scout/report.ts tests/cli.test.ts
git commit -m "feat: add scout CLI demo"
```

### Task 5: Optional OpenAI Refinement

**Files:**
- Create: `src/llm/openaiRefiner.ts`
- Modify: `src/scout/report.ts`
- Create: `tests/llm/openaiRefiner.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { maybeRefineReport } from "../../src/llm/openaiRefiner.js";

describe("maybeRefineReport", () => {
  it("returns the original report when no API key is configured", async () => {
    const report = {
      decision: "go" as const,
      score: 82,
      summary: "Strong fit.",
      effort: { days: 7, confidence: "medium" as const, drivers: ["CAP"] },
      tracks: ["Developer Tooling Agents"],
      risks: [],
      checklist: ["Register CROO Agent"],
      sources: []
    };

    await expect(maybeRefineReport(report, { apiKey: "" })).resolves.toEqual(report);
  });
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test -- tests/llm/openaiRefiner.test.ts`

Expected: FAIL because OpenAI refiner does not exist.

- [ ] **Step 3: Implement optional OpenAI Responses API adapter**

Use `import OpenAI from "openai"`, `client.responses.create`, `model: process.env.OPENAI_MODEL ?? "gpt-5.5"`, and parse `response.output_text` as JSON only after Zod validation.

- [ ] **Step 4: Run tests and verify green**

Run: `npm test -- tests/llm/openaiRefiner.test.ts`

Expected: PASS without `OPENAI_API_KEY`.

- [ ] **Step 5: Commit**

```bash
git add src/llm tests/llm src/scout/report.ts
git commit -m "feat: add optional OpenAI report refinement"
```

### Task 6: CROO Provider Adapter

**Files:**
- Create: `src/croo/provider.ts`
- Create: `tests/croo/provider.test.ts`

- [ ] **Step 1: Write failing provider tests**

```ts
import { describe, expect, it } from "vitest";
import { handlePaidOrder } from "../../src/croo/provider.js";

describe("handlePaidOrder", () => {
  it("generates and delivers a scout report for a paid order", async () => {
    const deliveries: unknown[] = [];
    const client = {
      deliverOrder: async (_orderId: string, payload: unknown) => {
        deliveries.push(payload);
        return { ok: true };
      }
    };

    await handlePaidOrder({
      client,
      orderId: "order-1",
      request: {
        url: "https://dorahacks.io/hackathon/croo-hackathon",
        builderProfile: "solo TypeScript builder",
        constraints: []
      },
      html: "<title>CROO Agent Hackathon</title><body>Integrated with CAP Developer Tooling Agents $10,200</body>"
    });

    expect(deliveries).toHaveLength(1);
    expect(JSON.stringify(deliveries[0])).toContain("go");
  });
});
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test -- tests/croo/provider.test.ts`

Expected: FAIL because provider module does not exist.

- [ ] **Step 3: Implement provider functions**

Export `handlePaidOrder` for tests and `startCrooProvider` for runtime. Runtime imports `AgentClient` and `EventType` from `@croo-network/sdk`, accepts negotiations, and delivers reports on paid orders.

- [ ] **Step 4: Run tests and verify green**

Run: `npm test -- tests/croo/provider.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/croo tests/croo
git commit -m "feat: add CROO provider adapter"
```

### Task 7: Submission Package

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `submission/dorahacks.md`
- Create: `submission/demo-script.md`
- Create: `src/index.ts`

- [ ] **Step 1: Write user-facing documentation**

README must include:

- What the agent does.
- Local quickstart.
- CROO Agent Store setup fields.
- SDK methods used: `acceptNegotiation`, `deliverOrder`, WebSocket event listening.
- Demo commands.
- Environment variables.
- Submission checklist.

- [ ] **Step 2: Write submission drafts**

`submission/dorahacks.md` contains title, tagline, problem, solution, CROO integration, track selection, and clearly labeled final fields for the published GitHub repository URL and recorded demo video URL.

`submission/demo-script.md` contains a five-minute script with scenes for CLI, CROO listing, paid order, delivered report, and DoraHacks submission.

- [ ] **Step 3: Build and test**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add README.md LICENSE submission src/index.ts
git commit -m "docs: add submission package"
```

### Task 8: Final Verification and Handoff

**Files:**
- Modify only if verification finds defects.

- [ ] **Step 1: Run final verification**

Run:

```bash
npm test
npm run lint
npm run build
npm run scout -- --url https://dorahacks.io/hackathon/croo-hackathon --profile "solo TypeScript/OpenAI builder, 2 weeks available" --format markdown
git status --short
```

Expected: tests, lint, and build pass; CLI prints a report; git status is clean.

- [ ] **Step 2: Prepare external submission checklist**

Report the exact remaining user actions:

- Create CROO provider agent and service in Agent Store.
- Add `CROO_SDK_KEY` to `.env`.
- Run `npm run provider`.
- Publish GitHub repository.
- Record demo using `submission/demo-script.md`.
- Submit DoraHacks BUIDL using `submission/dorahacks.md`.
