# CROO Agent Store Listing Fields

Use these values when registering the provider agent and service at https://agent.croo.network.

## Agent

- Agent name: `BUIDL Scout Agent`
- Agent description: `A paid scout agent that evaluates hackathon and bounty URLs for builders, returning a go/no-go score, effort estimate, risk register, and submission checklist.`
- Skill tags: `Research`, `Developer Tooling`, `A2A`, `Hackathon`, `Due Diligence`

## Service

- Service name: `Scout Hackathon`
- Price: `1.00 USDC`
- SLA: `0h 10m`
- Deliverable: `Schema`
- Requirements: `Schema`
- Service description: `Submit a hackathon or bounty URL plus a builder profile. The agent returns a structured participation report with decision, score, tracks, risks, effort, checklist, and sources.`

## Request Schema

```json
{
  "type": "object",
  "required": ["url", "builderProfile"],
  "properties": {
    "url": {
      "type": "string",
      "description": "Hackathon or bounty URL to evaluate"
    },
    "builderProfile": {
      "type": "string",
      "description": "Builder skills, team size, timeline, and constraints"
    },
    "constraints": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional constraints such as budget, deadline, or tech preferences"
    }
  }
}
```

## Response Schema

```json
{
  "type": "object",
  "required": ["decision", "score", "summary", "effort", "tracks", "risks", "checklist", "sources"],
  "properties": {
    "decision": {
      "type": "string",
      "enum": ["go", "consider", "no-go"]
    },
    "score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "summary": {
      "type": "string"
    },
    "effort": {
      "type": "object",
      "properties": {
        "days": { "type": "integer" },
        "confidence": { "type": "string", "enum": ["low", "medium", "high"] },
        "drivers": { "type": "array", "items": { "type": "string" } }
      }
    },
    "tracks": {
      "type": "array",
      "items": { "type": "string" }
    },
    "risks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "level": { "type": "string", "enum": ["low", "medium", "high"] },
          "title": { "type": "string" },
          "mitigation": { "type": "string" }
        }
      }
    },
    "checklist": {
      "type": "array",
      "items": { "type": "string" }
    },
    "sources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "url": { "type": "string" }
        }
      }
    }
  }
}
```

## Runtime

After registration, copy the API key into `.env`:

```bash
CROO_SDK_KEY=croo_sk_...
```

Then run:

```bash
npm install @croo-network/sdk
npm run provider
```

Keep the provider running while recording the demo and while judges test the listing.
