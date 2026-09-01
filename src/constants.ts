export const SERVER_NAME = "ze-mcp-server";
export const SERVER_VERSION = "0.1.3";
export const NPM_PACKAGE_NAME = "ze-mcp-unofficial";
export const PINNED_NPM_PACKAGE = `${NPM_PACKAGE_NAME}@${SERVER_VERSION}`;

/**
 * Default Brazil Zé Delivery GraphQL surface.
 * Live-probed 2026-08-28: POST /public-api returns JSON 200/400/401.
 * Override with ZE_API_BASE.
 */
export const DEFAULT_API_BASE = "https://api.ze.delivery";

export const CONSUMER_HOSTS: Record<string, string> = {
  BR: "https://api.ze.delivery"
};

/**
 * Unofficial Zé consumer GraphQL path. Introspection is disabled;
 * operations below were live-probed as JSON 200/400/401.
 */
export const PATHS = {
  graphql: "/public-api"
} as const;

export const OPERATIONS = {
  categories: "listCategories",
  groups: "listRootProductGroups",
  search: "searchProducts",
  loadCategory: "loadCategory",
  loadCart: "loadCart",
  loadProduct: "loadProduct",
  payment: "listPaymentMethods",
  loadCheckout: "loadCheckout",
  manageCheckout: "manageCheckout",
  bulkAdd: "bulkAddToCart",
  clearItems: "clearCartItems",
  applyCoupon: "applyCoupon",
  rate: "rateOrder",
  completeCheckout: "completeCheckout",
  orders: "listOrders",
  track: "loadOrder",
  trackV2: "loadOrderv2",
  place: "createOrder",
  cancel: "cancelOrder"
} as const;

export const WEB_ORIGIN = "https://www.ze.delivery";
export const WEB_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export const REQUEST_TIMEOUT_MS = 20_000;
export const TOKEN_DIR_NAME = ".ze-mcp";
