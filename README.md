# BUIDL Scout Agent

BUIDL Scout Agent is a paid, callable CROO-style agent that evaluates hackathon and bounty links for builders. It turns an opportunity URL into a structured go/no-go report with score, effort estimate, track fit, risks, checklist, and source links.

The project is built for the CROO Agent Hackathon and targets two tracks:

- Research & Intelligence Agents
- Developer Tooling Agents

## What It Does

Input:

```json
{
  "url": "https://dorahacks.io/hackathon/croo-hackathon",
  "builderProfile": "solo TypeScript/OpenAI builder, 2 weeks available",
  "constraints": ["prefer low infrastructure cost"]
}
```

Output:

```json
{
  "decision": "go",
  "score": 89,
  "summary": "CROO Agent Hackathon is a strong fit...",
  "effort": {
    "days": 10,
    "confidence": "low",
    "drivers": ["CAP provider integration", "Demo recording and submission narrative"]
  },
  "tracks": ["Research & Intelligence Agents", "Developer Tooling Agents"],
  "risks": [
    {
      "level": "high",
      "title": "External account setup",
      "mitigation": "Register the CROO Agent Store service and API key before recording the final demo."
    }
  ],
  "checklist": ["Register and list the agent on CROO Agent Store"],
  "sources": [{ "title": "CROO Agent Hackathon", "url": "https://dorahacks.io/hackathon/croo-hackathon" }]
}
```

## Architecture

- `src/domain`: Zod schemas, typed reports, scoring, effort, risks, and checklist rules.
- `src/scout`: page extraction, network fallback, report orchestration, Markdown formatting.
- `src/llm`: optional OpenAI Responses API refinement. The agent works without `OPENAI_API_KEY`.
- `src/croo`: CROO provider adapter for negotiation acceptance and paid-order delivery.
- `src/cli.ts`: local demo CLI for repeatable testing and video recording.

The core report generator is deterministic and does not require external credentials. CROO and OpenAI are adapters around that core.

## Requirements

- Node.js 18+
- npm
- CROO Agent Store account for live CAP demo
- Base USDC only if you run an end-to-end paid requester flow

## Install

```bash
npm install
```

The live provider uses `@croo-network/sdk` and is installed with the project dependencies.

## Local Demo

```bash
npm run scout -- --url https://dorahacks.io/hackathon/croo-hackathon --profile "solo TypeScript/OpenAI builder, 2 weeks available" --format markdown
```

JSON output:

```bash
npm run scout -- --url https://dorahacks.io/hackathon/croo-hackathon --profile "solo TypeScript/OpenAI builder" --format json
```

## Optional OpenAI Refinement

The default report is deterministic. To allow final wording refinement, set:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
```

The adapter uses the OpenAI Responses API through the official TypeScript SDK and validates the returned JSON against `ScoutReportSchema`.

## CROO Agent Store Setup

Register an agent at `https://agent.croo.network`, then configure one service:

- Service name: `Scout Hackathon`
- Price: `1.00 USDC` or another small demo price
- Description: `Evaluates hackathon and bounty URLs and returns a structured go/no-go builder report.`
- SLA: `0h 10m`
- Deliverable: `Schema`
- Requirements: `Schema`

Suggested request schema:

```json
{
  "url": "string",
  "builderProfile": "string",
  "constraints": ["string"]
}
```

Suggested response schema is the `ScoutReportSchema` represented by the sample output above.

## CROO Provider

Create `.env` from `.env.example` and set:

```bash
CROO_API_URL=https://api.croo.network
CROO_WS_URL=wss://api.croo.network/ws
CROO_SDK_KEY=croo_sk_...
```

Start the provider:

```bash
npm run provider
```

The provider uses these SDK capabilities:

- `connectWebSocket()` for CAP event listening
- `acceptNegotiation(negotiationId)` for incoming negotiations
- `deliverOrder(orderId, payload)` after `OrderPaid`
- `getOrder(orderId)` and `getNegotiation(negotiationId)` to resolve paid-order requirements

## Verification

```bash
npm test
npm run lint
npm run build
```

## Submission Checklist

- Public GitHub repository with MIT license
- CROO Agent Store listing
- CAP provider running with `CROO_SDK_KEY`
- One recorded paid order flow
- Demo video under five minutes
- DoraHacks BUIDL form with repository and video links

## Notes

If live page fetching fails during a demo, the agent keeps a curated fallback for the official CROO hackathon URL and marks the report with a `Source unavailable` risk. This keeps the demo stable while still disclosing source uncertainty.
