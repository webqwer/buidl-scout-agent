import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createScoutReport } from "../scout/report.js";
import { ScoutInputSchema, type ScoutInput, type ScoutReport } from "../domain/types.js";

type DeliveringClient = {
  deliverOrder(orderId: string, payload: unknown): Promise<unknown>;
};

type PaidOrderArgs = {
  client: DeliveringClient;
  orderId: string;
  request: unknown;
  html?: string;
};

type CrooRuntimeConfig = {
  apiUrl: string;
  wsUrl: string;
  sdkKey: string;
};

export async function handlePaidOrder(args: PaidOrderArgs): Promise<ScoutReport> {
  const request = ScoutInputSchema.omit({ html: true, useOpenAI: true }).parse(args.request);
  const report = await createScoutReport({
    ...request,
    html: args.html
  });

  await args.client.deliverOrder(args.orderId, {
    type: "schema",
    data: report
  });

  return report;
}

export async function startCrooProvider(config = readCrooConfig()): Promise<void> {
  const sdk = await loadCrooSdk();
  const client = new sdk.AgentClient(
    {
      baseURL: config.apiUrl,
      wsURL: config.wsUrl,
      logger: console
    },
    config.sdkKey
  );

  const stream = await client.connectWebSocket();

  stream.on(sdk.EventType.NegotiationCreated, async (event: { negotiation_id?: string; negotiationId?: string }) => {
    const negotiationId = event.negotiation_id ?? event.negotiationId;
    if (!negotiationId) return;
    await client.acceptNegotiation(negotiationId);
    console.log(`Accepted negotiation ${negotiationId}`);
  });

  stream.on(sdk.EventType.OrderPaid, async (event: { order_id?: string; orderId?: string; request?: unknown }) => {
    const orderId = event.order_id ?? event.orderId;
    if (!orderId) return;

    try {
      const request = event.request ?? (await readOrderRequest(client, orderId));
      await handlePaidOrder({ client, orderId, request });
      console.log(`Delivered scout report for order ${orderId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown provider error";
      console.error(`Failed to deliver order ${orderId}: ${message}`);
    }
  });

  console.log("BUIDL Scout CROO provider is online.");
}

function readCrooConfig(): CrooRuntimeConfig {
  const sdkKey = process.env.CROO_SDK_KEY;
  if (!sdkKey) {
    throw new Error("Missing CROO_SDK_KEY. Register the agent in CROO Agent Store and copy the API key.");
  }

  return {
    apiUrl: process.env.CROO_API_URL ?? "https://api.croo.network",
    wsUrl: process.env.CROO_WS_URL ?? "wss://api.croo.network/ws",
    sdkKey
  };
}

async function loadCrooSdk(): Promise<any> {
  try {
    const moduleName = "@croo-network/sdk";
    return await import(moduleName);
  } catch {
    throw new Error("Missing @croo-network/sdk. Install it with npm install @croo-network/sdk after CROO publishes or provides the package.");
  }
}

async function readOrderRequest(client: { getOrder?: (orderId: string) => Promise<{ request?: unknown; metadata?: unknown }> }, orderId: string): Promise<unknown> {
  const order = await client.getOrder?.(orderId);
  const request = order?.request ?? order?.metadata;
  if (!request) {
    throw new Error("Order request payload was not available from the CROO event or order lookup.");
  }
  return request;
}

export function isProviderDirectRun(moduleUrl: string, argvPath: string | undefined): boolean {
  if (!argvPath) return false;
  return resolve(fileURLToPath(moduleUrl)) === resolve(argvPath);
}

if (isProviderDirectRun(import.meta.url, process.argv[1])) {
  startCrooProvider().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown CROO provider startup error";
    console.error(message);
    process.exitCode = 1;
  });
}
