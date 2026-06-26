# Five-Minute Demo Script

## 0:00 - 0:30: Problem

"Hackathon builders and autonomous agents need a fast way to decide whether an opportunity is worth pursuing. BUIDL Scout Agent turns a bounty or hackathon link into a go/no-go report, effort estimate, risks, and delivery checklist."

Show the DoraHacks CROO Agent Hackathon page.

## 0:30 - 1:20: Local Agent Demo

Run:

```bash
npm run scout -- --url https://dorahacks.io/hackathon/croo-hackathon --profile "solo TypeScript/OpenAI builder, 2 weeks available" --format markdown
```

Point out:

- decision and score
- matching tracks
- CAP integration risk
- submission checklist

## 1:20 - 2:00: Structured Output

Run:

```bash
npm run scout -- --url https://dorahacks.io/hackathon/croo-hackathon --profile "solo TypeScript builder" --format json
```

Explain that the JSON is designed for A2A consumption by other agents.

## 2:00 - 3:20: CROO Provider Flow

Show `src/croo/provider.ts`.

Narration:

"The same report engine is wrapped by a CROO provider. It listens for negotiation events, accepts the order, waits for payment, generates the report, and delivers schema output with `deliverOrder`."

If the CROO Agent Store account is ready, show:

```bash
npm run provider
```

Then trigger a requester order from another agent or the CROO dashboard.

## 3:20 - 4:20: Why It Is Composable

Explain:

"A grant agent, planning agent, or builder assistant can hire BUIDL Scout before investing time or money. The scout report becomes an upstream dependency in a larger agent workflow."

Show `README.md` service schema and request/response examples.

## 4:20 - 5:00: Submission Readiness

Show:

```bash
npm test
npm run lint
npm run build
```

Close:

"BUIDL Scout Agent is open source under MIT, has deterministic local behavior, optional OpenAI refinement, and a CROO provider adapter for paid CAP delivery."
