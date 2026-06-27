import { describe, expect, it } from "vitest";
import { handlePaidOrder, isProviderDirectRun } from "../../src/croo/provider.js";

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
    expect(deliveries[0]).toMatchObject({ deliverableType: "schema" });
    expect(JSON.parse((deliveries[0] as { deliverableText: string }).deliverableText).decision).toBe("go");
  });

  it("accepts a JSON string request from CROO negotiation requirements", async () => {
    const deliveries: unknown[] = [];
    const client = {
      deliverOrder: async (_orderId: string, payload: unknown) => {
        deliveries.push(payload);
        return { ok: true };
      }
    };

    await handlePaidOrder({
      client,
      orderId: "order-2",
      request: JSON.stringify({
        url: "https://dorahacks.io/hackathon/croo-hackathon",
        builderProfile: "small TypeScript team",
        constraints: []
      }),
      html: "<title>CROO Agent Hackathon</title><body>CAP A2A developer tooling deadline USDC</body>"
    });

    expect(deliveries).toHaveLength(1);
    expect(JSON.parse((deliveries[0] as { deliverableText: string }).deliverableText).score).toBeGreaterThan(0);
  });

  it("recognizes Windows paths for provider direct runs", () => {
    expect(isProviderDirectRun("file:///D:/xxzl/buidl-scout-agent/src/croo/provider.ts", "D:\\xxzl\\buidl-scout-agent\\src\\croo\\provider.ts")).toBe(true);
  });
});
