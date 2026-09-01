import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  BulkAddInputSchema,
  CancelOrderInputSchema,
  CartWriteInputSchema,
  CategoryInputSchema,
  CouponInputSchema,
  LogoutInputSchema,
  OrderIdInputSchema,
  PlaceOrderInputSchema,
  ProductIdInputSchema,
  RateOrderInputSchema,
  ReadInputSchema,
  ResponseOnlyInputSchema,
  SearchInputSchema
} from "../schemas/common.js";
import {
  handleApplyCoupon,
  handleBulkAddToCart,
  handleCancelOrder,
  handleCapabilities,
  handleCheckoutPreview,
  handleClearCartItems,
  handleCompleteCheckout,
  handleConnectionStatus,
  handleGetCart,
  handleListCategories,
  handleListGroups,
  handleListPaymentMethods,
  handleLoadCategory,
  handleLoadCheckout,
  handleLogout,
  handleOrderHistory,
  handlePlaceOrder,
  handlePrivacyAudit,
  handleProductDetail,
  handleRateOrder,
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
  ze_load_category: call(handleLoadCategory),
  ze_get_cart: call(handleGetCart),
  ze_product_detail: call(handleProductDetail),
  ze_list_payment_methods: call(handleListPaymentMethods),
  ze_load_checkout: call(handleLoadCheckout),
  ze_checkout_preview: call(handleCheckoutPreview),
  ze_order_history: call(handleOrderHistory),
  ze_track_order: call(handleTrackOrder),
  ze_bulk_add_to_cart: call(handleBulkAddToCart),
  ze_clear_cart_items: call(handleClearCartItems),
  ze_apply_coupon: call(handleApplyCoupon),
  ze_rate_order: call(handleRateOrder),
  ze_place_order: call(handlePlaceOrder),
  ze_complete_checkout: call(handleCompleteCheckout),
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
    "ze_load_category",
    {
      title: "Load a Zé category",
      description: "Read-only loadCategory (live 200 with checkout-information-not-found without session).",
      inputSchema: CategoryInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleLoadCategory(args)
  );

  server.registerTool(
    "ze_get_cart",
    {
      title: "Inspect Zé cart",
      description: "loadCart { cart { id } }. Field names other than cart failed GraphQL validation.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleGetCart(args)
  );

  server.registerTool(
    "ze_product_detail",
    {
      title: "Zé product detail",
      description: "loadProduct(id) with category. Read-only.",
      inputSchema: ProductIdInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleProductDetail(args)
  );

  server.registerTool(
    "ze_list_payment_methods",
    {
      title: "Zé payment methods",
      description: "listPaymentMethods (200 with internal error without a full session). Last-four redacted. Does not charge.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleListPaymentMethods(args)
  );

  server.registerTool(
    "ze_load_checkout",
    {
      title: "Zé loadCheckout",
      description: "Read-only loadCheckout. Does not complete payment.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleLoadCheckout(args)
  );

  server.registerTool(
    "ze_checkout_preview",
    {
      title: "Zé checkout preview",
      description: "Read-only loadCheckout query. Does not run the manageCheckout mutation and does not charge.",
      inputSchema: ReadInputSchema.shape,
      annotations: readOnly
    },
    async (args) => handleCheckoutPreview(args)
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
    "ze_bulk_add_to_cart",
    {
      title: "Bulk add to Zé cart (gated)",
      description: "bulkAddToCart(bulkAddToCartInput). Dual-gated plus fail-closed 18+ confirmation. Does not checkout.",
      inputSchema: BulkAddInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleBulkAddToCart(args)
  );

  server.registerTool(
    "ze_clear_cart_items",
    {
      title: "Clear Zé cart items (gated)",
      description: "clearCartItems. Dual-gated. Does not checkout.",
      inputSchema: CartWriteInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleClearCartItems(args)
  );

  server.registerTool(
    "ze_apply_coupon",
    {
      title: "Apply Zé coupon (gated)",
      description: "applyCoupon(couponCode: String!). Dual-gated. Does not checkout.",
      inputSchema: CouponInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleApplyCoupon(args)
  );

  server.registerTool(
    "ze_rate_order",
    {
      title: "Rate a Zé order",
      description: "rateOrder(orderNumber, rating). Requires explicit_user_intent. Does not charge.",
      inputSchema: RateOrderInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleRateOrder(args)
  );

  server.registerTool(
    "ze_complete_checkout",
    {
      title: "Complete Zé checkout (gated pay)",
      description: "completeCheckout needs access token (401 without). Dual-gated plus 18+ confirmation.",
      inputSchema: PlaceOrderInputSchema.shape,
      annotations: gatedWrite
    },
    async (args) => handleCompleteCheckout(args)
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
