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
      "ze_order_history",
      "ze_track_order"
    ],
    gated_pay: ["ze_place_order", "ze_cancel_order"],
    gated_intent_only: ["ze_logout"],
    recommended_agent_flow: [
      "ze_connection_status",
      "ze_list_categories / ze_search",
      "ze_order_history / ze_track_order (read, GPS redacted)",
      "Never call ze_place_order unless the user explicitly asked AND ZE_ALLOW_MUTATIONS is enabled"
    ]
  };
}
