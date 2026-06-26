# BUIDL Scout Agent Design

## Goal

Build a CROO-compatible paid agent that turns a hackathon or bounty link into a structured participation decision: go/no-go score, effort estimate, prize fit, delivery checklist, risk flags, and submission strategy. The project is designed for the CROO Agent Hackathon and will be submitted as a public open-source BUIDL.

## Hackathon Fit

The agent targets two CROO tracks:

- Research & Intelligence Agents: source-grounded research and decision reports.
- Developer Tooling Agents: helps builders evaluate bounties, hackathons, and submission readiness.

The implementation emphasizes the judging criteria:

- Technical execution: real CROO provider integration through `@croo-network/sdk`, plus deterministic local tests.
- A2A composability: the service produces structured JSON suitable for other agents to consume.
- Innovation: a commercializable scout service for builders and autonomous agents.
- Usability: CLI demo, README, repeatable examples, and concise report output.
- Presentation: ready-to-record demo script and DoraHacks submission copy.

## Product Scope

The MVP exposes one service: `Scout Hackathon`.

Input:

```json
{
  "url": "https://dorahacks.io/hackathon/croo-hackathon",
  "builderProfile": "solo TypeScript/OpenAI builder, 2 weeks available",
  "constraints": ["must be open source", "prefer low infrastructure cost"]
}
```

Output:

```json
{
  "decision": "go",
  "score": 86,
  "summary": "Strong fit because the builder can ship a focused CAP-integrated agent before the safe deadline.",
  "effort": {
    "days": 8,
    "confidence": "medium",
    "drivers": ["CAP onboarding", "demo recording", "public repository polish"]
  },
  "tracks": ["Research & Intelligence Agents", "Developer Tooling Agents"],
  "risks": [
    {
      "level": "high",
      "title": "External account setup",
      "mitigation": "Prepare env-based integration and complete CROO registration early."
    }
  ],
  "checklist": ["Register CROO Agent", "List service", "Run provider", "Record CAP order demo"],
  "sources": [
    {
      "title": "CROO Agent Hackathon",
      "url": "https://dorahacks.io/hackathon/croo-hackathon"
    }
  ]
}
```

## Architecture

The repository is a Node.js 18+ TypeScript app with five small subsystems:

- `domain`: typed input/output models, scoring rules, and validation.
- `scout`: fetches source content, extracts hackathon facts, and builds the report.
- `llm`: optional OpenAI-backed refinement. If `OPENAI_API_KEY` is absent, deterministic analysis still works.
- `croo`: provider adapter for CROO WebSocket events and CAP delivery.
- `cli`: local demo command for repeatable testing and video recording.

The core scout logic does not depend on CROO or OpenAI. That keeps tests deterministic and lets the demo run without secrets. The CROO provider wraps the core report generator and is activated only when `CROO_SDK_KEY` is present.

## Data Flow

CLI flow:

1. User runs `npm run scout -- --url <hackathon-url> --profile "<profile>"`.
2. CLI validates input with Zod.
3. Source fetcher retrieves public HTML when network is enabled.
4. Fact extractor identifies title, dates, prize text, tracks, requirements, and judging hints.
5. Scoring engine calculates score, effort, risks, and checklist.
6. Optional OpenAI refiner improves wording while preserving the JSON schema.
7. CLI prints JSON or Markdown.

CROO provider flow:

1. Provider starts with `npm run provider`.
2. CROO SDK connects using `CROO_API_URL`, `CROO_WS_URL`, and `CROO_SDK_KEY`.
3. On negotiation, provider accepts.
4. On paid order, provider parses the requester payload.
5. Core scout service generates a structured report.
6. Provider calls `deliverOrder` with schema delivery data.

## Error Handling

- Invalid input returns a clear validation error and does not call external services.
- Fetch failures fall back to URL-only analysis with a risk flag named `Source unavailable`.
- Missing OpenAI credentials skips LLM refinement without failing the report.
- Missing CROO credentials prevents provider startup with setup instructions.
- CROO event handler catches order-specific failures and logs the order id, status, and suggested retry.
- Report generation is idempotent for the same input and source snapshot.

## Testing

Use TDD for production behavior:

- Unit tests for input validation, scoring, risk generation, checklist generation, and report formatting.
- Integration-style tests for scout report generation with fixture HTML.
- Adapter tests for CROO provider behavior using a fake CROO client.
- CLI tests for JSON and Markdown output.

Verification commands:

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run scout -- --url https://dorahacks.io/hackathon/croo-hackathon --profile "solo TypeScript builder"`

## Deliverables

- Public-ready TypeScript source code.
- MIT license.
- README with setup, CROO registration, SDK methods used, and demo steps.
- `.env.example` for OpenAI and CROO settings.
- Demo script for a five-minute video.
- DoraHacks submission draft covering title, tagline, description, tracks, GitHub URL, video URL, and impact.

## User-Owned External Steps

The implementation will prepare everything possible locally. Final submission requires the user to perform or authorize:

- Sign in to DoraHacks.
- Create or select a public GitHub repository and push this project.
- Sign in to CROO Agent Store, register the provider agent, configure its service, and copy the API key.
- Deposit a small amount of Base USDC only if an end-to-end requester order demo is recorded.
- Submit the final BUIDL form on DoraHacks with the prepared links and text.
