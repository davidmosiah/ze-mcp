import { OPERATIONS, PATHS, SERVER_VERSION } from "../constants.js";
import { peekConfig } from "./config.js";

export function buildCapabilities() {
  const config = peekConfig();
  return {
    unofficial: true as const,
    version: SERVER_VERSION,
    surface: "Zé Delivery consumer GraphQL (api.ze.delivery/public-api) — not a partner B2B API",
    api_base: config.apiBase,
    documented_paths: PATHS,
    operations: OPERATIONS,
    mutations_enabled: config.allowMutations,
    never_pays_by_default: true,
    read_tools: [
      "ze_list_categories",
      "ze_list_groups",
      "ze_search",
      "ze_load_category",
      "ze_get_cart",
      "ze_product_detail",
      "ze_list_payment_methods",
      "ze_load_checkout",
      "ze_checkout_preview",
      "ze_order_history",
      "ze_track_order"
    ],
    gated_cart_writes: ["ze_bulk_add_to_cart", "ze_clear_cart_items", "ze_apply_coupon"],
    gated_pay: ["ze_place_order", "ze_complete_checkout", "ze_cancel_order"],
    gated_intent_only: ["ze_logout", "ze_rate_order"],
    honest_gaps: [
      { wanted: "saved addresses", probe: "Query.addresses / listAddresses / customer → GRAPHQL_VALIDATION_FAILED" },
      { wanted: "age API field", probe: "isLegalAge / legalAge → GRAPHQL_VALIDATION_FAILED; local 18+ gate is fail-closed" }
    ],
    recommended_agent_flow: [
      "ze_connection_status",
      "ze_list_categories / ze_search",
      "ze_order_history / ze_track_order (read, GPS redacted)",
      "Never call ze_place_order unless the user explicitly asked AND ZE_ALLOW_MUTATIONS is enabled"
    ]
  };
}
