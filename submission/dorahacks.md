# DoraHacks Submission Draft

## Project Name

BUIDL Scout Agent

## Tagline

A paid CROO agent that turns hackathon and bounty links into go/no-go reports, effort estimates, risks, and delivery checklists.

## Tracks

- Research & Intelligence Agents
- Developer Tooling Agents

## Short Description

BUIDL Scout Agent helps builders and autonomous agents decide whether a hackathon or bounty is worth pursuing. It reads an opportunity URL, extracts key facts, scores fit against a builder profile, estimates effort, identifies risks, and returns a schema-valid action plan that another agent can consume.

## Problem

Hackathon builders waste time on opportunities that look attractive but hide risky timelines, vague requirements, unclear judging criteria, or poor fit with their skills. Agent ecosystems need a callable due-diligence service that can evaluate opportunities before other agents commit money, time, or development capacity.

## Solution

BUIDL Scout Agent packages opportunity due diligence as a paid, callable agent service. A requester sends a hackathon or bounty URL plus builder constraints. The provider returns:

- go / consider / no-go decision
- 0-100 score
- effort estimate
- matching tracks
- risk register with mitigations
- delivery checklist
- source links

The output is structured JSON, so humans can read it and other agents can use it as an upstream planning dependency.

## CROO / CAP Integration

The project includes a CROO provider adapter in `src/croo/provider.ts`.

Runtime flow:

1. Provider connects to CROO WebSocket events.
2. Provider accepts incoming negotiations with `acceptNegotiation`.
3. After `OrderPaid`, provider generates the scout report.
4. Provider delivers schema output with `deliverOrder`.
5. Requester receives a paid, on-chain-settled report.

The deterministic CLI demonstrates the same report engine locally, and the provider adapter wraps it for CAP delivery.

## Why This Needs A2A

This service is useful as a dependency for other agents. A planning agent, investment agent, grant agent, or builder-assistant agent can hire BUIDL Scout before committing to a bounty. The requester does not need to trust a centralized SaaS flow: the service is priced, callable, and settled through CROO.

## Technical Highlights

- TypeScript / Node.js implementation
- Zod schemas for request and report validation
- Deterministic scoring engine
- Optional OpenAI Responses API refinement
- CROO provider adapter with dynamic SDK loading
- Local CLI demo
- Tested domain, extraction, CLI, OpenAI-bypass, and CROO-delivery behavior

## Repository URL

https://github.com/webqwer/buidl-scout-agent

## Demo Video URL

Record the walkthrough using `submission/demo-script.md`, upload it, and paste the final URL into the DoraHacks form.

## CROO Agent Store URL

After registering the agent and service at https://agent.croo.network, paste the public listing URL into the DoraHacks form.

## License

MIT
