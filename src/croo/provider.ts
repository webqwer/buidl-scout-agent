import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createScoutReport } from "../scout/report.js";
import { ScoutInputSchema, type ScoutInput, type ScoutReport } from "../domain/types.js";

type DeliveringClient = {
  deliverOrder(orderId: string, payload: unknown): Promise<unknown>;
};

type OrderLookupClient = {
  getOrder(orderId: string): Promise<{ negotiationId?: string; negotiation_id?: string; request?: unknown; metadata?: unknown }>;
  getNegotiation(negotiationId: string): Promise<{ requirements?: unknown; metadata?: unknown }>;
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

type LoggerLike = Pick<typeof console, "debug" | "error" | "info" | "warn">;

export async function handlePaidOrder(args: PaidOrderArgs): Promise<ScoutReport> {
  const request = ScoutInputSchema.omit({ html: true, useOpenAI: true }).parse(parseRequestPayload(args.request));
  const report = await createScoutReport({
    ...request,
    html: args.html
  });

  await args.client.deliverOrder(args.orderId, {
    deliverableType: "schema",
    deliverableText: JSON.stringify(report)
  });

  return report;
}

export async function startCrooProvider(config = readCrooConfig()): Promise<void> {
  const sdk = await loadCrooSdk();
  const client = new sdk.AgentClient(
    {
      baseURL: config.apiUrl,
      wsURL: config.wsUrl,
      logger: createRedactingLogger(console)
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

function parseRequestPayload(payload: unknown): unknown {
  if (typeof payload !== "string") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

function createRedactingLogger(logger: LoggerLike): LoggerLike {
  return {
    debug: (message?: unknown, ...args: unknown[]) => logger.debug(redactSecrets(message), ...args.map(redactSecrets)),
    error: (message?: unknown, ...args: unknown[]) => logger.error(redactSecrets(message), ...args.map(redactSecrets)),
    info: (message?: unknown, ...args: unknown[]) => logger.info(redactSecrets(message), ...args.map(redactSecrets)),
    warn: (message?: unknown, ...args: unknown[]) => logger.warn(redactSecrets(message), ...args.map(redactSecrets))
  };
}

function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/croo_sk_[A-Za-z0-9]+/g, "croo_sk_****");
  }

  if (Array.isArray(value)) {
    return value.map(redactSecrets);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactSecrets(entry)]));
  }

  return value;
}

async function loadCrooSdk(): Promise<any> {
  try {
    const moduleName = "@croo-network/sdk";
    return await import(moduleName);
  } catch {
    throw new Error("Missing @croo-network/sdk. Install it with npm install @croo-network/sdk after CROO publishes or provides the package.");
  }
}

async function readOrderRequest(client: OrderLookupClient, orderId: string): Promise<unknown> {
  const order = await client.getOrder(orderId);
  const negotiationId = order.negotiationId ?? order.negotiation_id;
  if (!negotiationId) {
    throw new Error("Order did not include a negotiation id.");
  }

  const negotiation = await client.getNegotiation(negotiationId);
  const request = negotiation.requirements ?? negotiation.metadata ?? order.request ?? order.metadata;
  if (!request) {
    throw new Error("Order request payload was not available from the CROO negotiation or order lookup.");
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
