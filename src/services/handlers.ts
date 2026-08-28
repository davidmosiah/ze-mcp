import type { PrivacyMode, ResponseFormat } from "../types.js";
import { peekConfig } from "./config.js";
import { ZeClient, ZeClientError } from "./ze-client.js";
import { TokenStore } from "./token-store.js";
import { applyPrivacy } from "./privacy.js";
import { bulletList, makeError, makeResponse } from "./format.js";
import {
  MutationGateError,
  assertCancelOrderAllowed,
  assertExplicitIntent,
  assertLogoutAllowed,
  assertNotGuestForCharge,
  assertPlaceOrderAllowed
} from "./mutation-gate.js";
import { buildConnectionStatus } from "./connection-status.js";
import { buildCapabilities } from "./capabilities.js";
import { buildPrivacyAudit } from "./audit.js";

export interface HandlerDeps {
  client?: ZeClient;
  tokens?: TokenStore;
  allowMutations?: boolean;
  fetchImpl?: typeof fetch;
}

function deps(extra: HandlerDeps = {}) {
  const config = peekConfig();
  const tokens = extra.tokens ?? new TokenStore(config.tokenPath);
  const client = extra.client ?? new ZeClient(config, tokens, extra.fetchImpl);
  const allowMutations = extra.allowMutations ?? config.allowMutations;
  return { config, tokens, client, allowMutations };
}

function gateError(error: unknown) {
  if (error instanceof MutationGateError || error instanceof ZeClientError) {
    return makeError(error.message);
  }
  return makeError((error as Error).message);
}

function wrap<T>(payload: T, format: ResponseFormat, title: string, fields: Record<string, unknown>) {
  return makeResponse(payload, format, bulletList(title, fields));
}

export async function handleConnectionStatus(input: { response_format?: ResponseFormat } = {}) {
  const status = await buildConnectionStatus();
  return wrap(status, input.response_format ?? "markdown", "Zé MCP · connection", {
    ok: status.ok,
    mutations_enabled: status.mutations_enabled,
    unofficial: true,
    never_pays_by_default: true
  });
}

export async function handleCapabilities(input: { response_format?: ResponseFormat } = {}) {
  const caps = buildCapabilities();
  return wrap(caps, input.response_format ?? "markdown", "Zé MCP · capabilities", {
    unofficial: caps.unofficial,
    mutations_enabled: caps.mutations_enabled,
    never_pays_by_default: true
  });
}

export async function handlePrivacyAudit(input: { response_format?: ResponseFormat } = {}) {
  const audit = buildPrivacyAudit();
  return wrap(audit, input.response_format ?? "markdown", "Zé MCP · privacy", {
    privacy_mode: audit.privacy_mode,
    mutations_enabled: audit.mutations_enabled,
    redacts_by_default: (audit.redacts_by_default as string[]).join(", ")
  });
}

export async function handleListCategories(
  input: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {},
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.listCategories();
    const payload = applyPrivacy({ unofficial: true, categories: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", "Zé catalog · categories", {
      unofficial: true
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleListGroups(
  input: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {},
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.listGroups();
    const payload = applyPrivacy({ unofficial: true, groups: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", "Zé catalog · groups", { unofficial: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleSearch(
  input: { query: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.search(input.query);
    const payload = applyPrivacy(
      { unofficial: true, query: input.query, search: raw },
      input.privacy_mode ?? config.privacyMode
    );
    return wrap(payload, input.response_format ?? "markdown", "Zé search", {
      unofficial: true,
      query: input.query
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleOrderHistory(
  input: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {},
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.orderHistory();
    const payload = applyPrivacy({ unofficial: true, orders: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", "Zé order history", { unofficial: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleTrackOrder(
  input: { order_id: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { config, client } = deps(extra);
  try {
    const raw = await client.trackOrder(input.order_id);
    const payload = applyPrivacy(
      { unofficial: true, status: raw, order_id: input.order_id },
      input.privacy_mode ?? config.privacyMode
    );
    return wrap(payload, input.response_format ?? "markdown", "Zé order status", {
      unofficial: true,
      gps_redacted: true
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handlePlaceOrder(
  input: {
    input?: Record<string, unknown>;
    explicit_user_intent?: boolean;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { tokens, client, allowMutations } = deps(extra);
  try {
    assertPlaceOrderAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const stored = await tokens.read();
    assertNotGuestForCharge(stored?.source);
    const raw = await client.placeOrder(input.input ?? {});
    return wrap({ unofficial: true, order: raw }, input.response_format ?? "json", "Zé place order", {
      unofficial: true
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleCancelOrder(
  input: { order_id: string; explicit_user_intent?: boolean; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { tokens, client, allowMutations } = deps(extra);
  try {
    assertCancelOrderAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const stored = await tokens.read();
    assertNotGuestForCharge(stored?.source);
    const raw = await client.cancelOrder(input.order_id);
    return wrap({ unofficial: true, cancel: raw }, input.response_format ?? "json", "Zé cancel order", {
      order_id: input.order_id
    });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleLogout(
  input: { explicit_user_intent?: boolean; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { tokens } = deps(extra);
  try {
    assertLogoutAllowed(input.explicit_user_intent);
    assertExplicitIntent(input.explicit_user_intent, "clear the local Zé Delivery token");
    await tokens.clear();
    return wrap({ unofficial: true, cleared: true }, input.response_format ?? "json", "Zé logout", {
      unofficial: true
    });
  } catch (error) {
    return gateError(error);
  }
}
