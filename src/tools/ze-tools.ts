import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CancelOrderInputSchema,
  LogoutInputSchema,
  OrderIdInputSchema,
  PlaceOrderInputSchema,
  ReadInputSchema,
  ResponseOnlyInputSchema,
  SearchInputSchema
} from "../schemas/common.js";
import {
  handleCancelOrder,
  handleCapabilities,
  handleConnectionStatus,
  handleListCategories,
  handleListGroups,
  handleLogout,
  handleOrderHistory,
  handlePlaceOrder,
  handlePrivacyAudit,
  handleSearch,
  handleTrackOrder
} from "../services/handlers.js";
import type { ToolResponse } from "../types.js";

type CallFn = (args: Record<string, unknown>) => Promise<ToolResponse>;
const call =
  <T,>(fn: (input: T) => Promise<ToolResponse>): CallFn =>
  (args) =>
    fn(args as T);

/** Same handlers as MCP tools — CLI `call` uses this so skill-only clients hit the identical gates. */
export const TOOL_CALLS: Record<string, CallFn> = {
  ze_connection_status: call(handleConnectionStatus),
  ze_capabilities: call(handleCapabilities),
  ze_privacy_audit: call(handlePrivacyAudit),
  ze_list_categories: call(handleListCategories),
  ze_list_groups: call(handleListGroups),
  ze_search: call(handleSearch),
  ze_order_history: call(handleOrderHistory),
  ze_track_order: call(handleTrackOrder),
  ze_place_order: call(handlePlaceOrder),
  ze_cancel_order: call(handleCancelOrder),
  ze_logout: call(handleLogout)
};

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;
const gatedWrite = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true } as const;

export function registerZeTools(server: McpServer): void {
  server.registerTool(
    "ze_connection_status",
    {
      title: "Zé connection status",
      description: "Local doctor: token present, mutations off by default, unofficial Zé Delivery GraphQL.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handleConnectionStatus(args)
  );

  server.registerTool(
    "ze_capabilities",
    {
      title: "Zé capabilities",
      description: "What this unofficial MCP can read and which writes stay gated.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handleCapabilities(args)
  );

  server.registerTool(
    "ze_privacy_audit",
    {
      title: "Zé privacy audit",
      description: "Shows redaction defaults (street/phone/GPS) and that place-order is off unless both gates are set.",
      inputSchema: ResponseOnlyInputSchema.shape,
      annotations: { ...readOnly, openWorldHint: false }
    },
    async (args) => handlePrivacyAudit(args)
  );

  server.registerTool(
    "ze_list_categories",
    {
      title: "List Zé catalog categories",
      description: "Read-only listCategories on the unofficial public GraphQL. Does not place an order.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleListCategories(args)
  );

  server.registerTool(
    "ze_list_groups",
    {
      title: "List Zé root product groups",
      description: "Read-only listRootProductGroups (Ofertas, Cervejas, …). Does not place an order.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleListGroups(args)
  );

  server.registerTool(
    "ze_search",
    {
      title: "Search Zé products",
      description: "Read-only searchProducts(queryTerm) on the unofficial GraphQL. Does not add to cart.",
      inputSchema: SearchInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleSearch(args)
  );

  server.registerTool(
    "ze_order_history",
    {
      title: "Zé order history",
      description: "Past consumer orders. Read-only. Street/phone/GPS redacted.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleOrderHistory(args)
  );

  server.registerTool(
    "ze_track_order",
    {
      title: "Track a Zé order",
      description: "loadOrder(orderNumber). Status only. Does not return GPS polylines or courier phone.",
      inputSchema: OrderIdInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleTrackOrder(args)
  );

  server.registerTool(
    "ze_place_order",
    {
      title: "Place a Zé order (gated)",
      description:
        "Fail-closed. Needs ZE_ALLOW_MUTATIONS and explicit_user_intent. Guest tokens cannot charge. Default examples never enable this.",
      inputSchema: PlaceOrderInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handlePlaceOrder(args)
  );

  server.registerTool(
    "ze_cancel_order",
    {
      title: "Cancel a Zé order (gated)",
      description: "Fail-closed. Needs ZE_ALLOW_MUTATIONS and explicit_user_intent. Guest tokens cannot charge.",
      inputSchema: CancelOrderInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleCancelOrder(args)
  );

  server.registerTool(
    "ze_logout",
    {
      title: "Clear local Zé token",
      description: "Deletes ~/.ze-mcp/tokens.json. Requires explicit_user_intent.",
      inputSchema: LogoutInputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
    },
    async (args) => handleLogout(args)
  );
}
