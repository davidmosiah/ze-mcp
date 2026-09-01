import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { promises as fs } from "node:fs";
import { PATHS, REQUEST_TIMEOUT_MS, WEB_USER_AGENT } from "../constants.js";
import type { FetchLike, ZeConfig, ZeTokenSet } from "../types.js";
import { TokenStore } from "./token-store.js";
import { assertAllowedConsumerPath, isAllowedZeHost } from "./path-allowlist.js";
import { envAccessToken } from "./config.js";

export class ZeClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ZeClientError";
  }
}

export const QUERIES = {
  categories: "query ListCategories { listCategories { id displayName icon } }",
  groups: "query ListRootProductGroups { listRootProductGroups { id displayName } }",
  search:
    "query SearchProducts($queryTerm: String!) { searchProducts(queryTerm: $queryTerm) { items { id displayName } } }",
  loadCategory:
    "query LoadCategory($categoryId: Int!) { loadCategory(filter: { categoryId: $categoryId }) { products { items { id displayName } } } }",
  loadCart: "query { loadCart { cart { id } } }",
  loadProduct:
    "query LoadProduct($id: ID!) { loadProduct(id: $id) { id displayName category { id displayName } } }",
  payment: "query { listPaymentMethods { __typename } }",
  loadCheckout: "query { loadCheckout { __typename } }",
  orders:
    "query ListOrders { listOrders { id number createdDate totalPrice statusesHistory { status createdDate } lineItems { id displayName } } }",
  track:
    "query LoadOrder($orderNumber: String!) { loadOrder(orderNumber: $orderNumber) { order { number createdDate totalPrice statusesHistory { status createdDate } lineItems { id displayName } } } }",
  trackV2:
    "query LoadOrderV2($orderNumber: String!) { loadOrderv2(orderNumber: $orderNumber) { __typename } }"
} as const;

export const MUTATIONS = {
  place: "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { __typename } }",
  cancel:
    "mutation CancelOrder($orderNumber: String!) { cancelOrder(orderNumber: $orderNumber) { __typename } }",
  bulkAdd:
    "mutation BulkAdd($bulkAddToCartInput: BulkAddToCartInput!) { bulkAddToCart(bulkAddToCartInput: $bulkAddToCartInput) { __typename } }",
  clearItems: "mutation { clearCartItems { __typename } }",
  applyCoupon: "mutation Apply($couponCode: String!) { applyCoupon(couponCode: $couponCode) { __typename } }",
  rate: "mutation Rate($orderNumber: String!, $rating: Int!) { rateOrder(orderNumber: $orderNumber, rating: $rating) { __typename } }",
  manageCheckout: "mutation { manageCheckout { __typename } }",
  completeCheckout: "mutation { completeCheckout { __typename } }"
} as const;

export const ALCOHOL_CATEGORY_IDS = new Set([92, 94, 95]);

export function consumerHeaders(origin: string, visitorId: string): Record<string, string> {
  return {
    accept: "application/json",
    "content-type": "application/json",
    "user-agent": WEB_USER_AGENT,
    origin,
    referer: `${origin}/`,
    "x-visitorid": visitorId
  };
}

export class ZeClient {
  constructor(
    private readonly config: ZeConfig,
    private readonly tokens: TokenStore,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async listCategories(): Promise<unknown> {
    return this.graphql(QUERIES.categories);
  }

  async listGroups(): Promise<unknown> {
    return this.graphql(QUERIES.groups);
  }

  async search(queryTerm: string): Promise<unknown> {
    return this.graphql(QUERIES.search, { queryTerm });
  }

  async loadCategory(categoryId: number): Promise<unknown> {
    return this.graphql(QUERIES.loadCategory, { categoryId });
  }

  async getCart(): Promise<unknown> {
    return this.graphql(QUERIES.loadCart);
  }

  async productDetail(id: string): Promise<unknown> {
    return this.graphql(QUERIES.loadProduct, { id });
  }

  async listPaymentMethods(): Promise<unknown> {
    return this.graphql(QUERIES.payment, undefined, { auth: true });
  }

  async loadCheckout(): Promise<unknown> {
    return this.graphql(QUERIES.loadCheckout, undefined, { auth: true });
  }

  async manageCheckout(): Promise<unknown> {
    return this.graphql(MUTATIONS.manageCheckout);
  }

  async bulkAddToCart(bulkAddToCartInput: Record<string, unknown>): Promise<unknown> {
    return this.graphql(MUTATIONS.bulkAdd, { bulkAddToCartInput }, { auth: true });
  }

  async clearCartItems(): Promise<unknown> {
    return this.graphql(MUTATIONS.clearItems, undefined, { auth: true });
  }

  async applyCoupon(couponCode: string): Promise<unknown> {
    return this.graphql(MUTATIONS.applyCoupon, { couponCode }, { auth: true });
  }

  async rateOrder(orderNumber: string, rating: number): Promise<unknown> {
    return this.graphql(MUTATIONS.rate, { orderNumber, rating }, { auth: true });
  }

  async completeCheckout(): Promise<unknown> {
    return this.graphql(MUTATIONS.completeCheckout, undefined, { auth: true });
  }

  async orderHistory(): Promise<unknown> {
    return this.graphql(QUERIES.orders, undefined, { auth: true });
  }

  async trackOrder(orderNumber: string): Promise<unknown> {
    return this.graphql(QUERIES.track, { orderNumber }, { auth: true });
  }

  async placeOrder(input: Record<string, unknown>): Promise<unknown> {
    return this.graphql(MUTATIONS.place, { input }, { auth: true });
  }

  async cancelOrder(orderNumber: string): Promise<unknown> {
    return this.graphql(MUTATIONS.cancel, { orderNumber }, { auth: true });
  }

  async visitorId(): Promise<string> {
    const fromEnv = process.env.ZE_DEVICE_ID?.trim();
    if (fromEnv) return fromEnv;
    try {
      const existing = (await fs.readFile(this.config.deviceIdPath, "utf8")).trim();
      if (existing) return existing;
    } catch {
      // create
    }
    const id = randomUUID();
    await fs.mkdir(dirname(this.config.deviceIdPath), { recursive: true, mode: 0o700 });
    await fs.writeFile(this.config.deviceIdPath, `${id}\n`, { mode: 0o600 });
    return id;
  }

  private async graphql(
    query: string,
    variables?: Record<string, unknown>,
    options: { auth?: boolean } = {}
  ): Promise<unknown> {
    const url = consumerRequestUrl(this.config.apiBase, PATHS.graphql);
    const visitorId = await this.visitorId();
    const headers: Record<string, string> = {
      ...consumerHeaders(this.config.origin, visitorId)
    };
    const token = await this.resolveAccess();
    if (options.auth && !token) {
      throw new ZeClientError(
        "No Zé Delivery access token. Run `ze-mcp-unofficial auth --from-header \"Bearer …\"` or set ZE_ACCESS_TOKEN.",
        undefined,
        "AUTH_REQUIRED"
      );
    }
    if (token) {
      headers.authorization = `Bearer ${token.access_token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify(variables ? { query, variables } : { query }),
        signal: controller.signal
      });
      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = { raw: text.slice(0, 400) };
      }
      if (!response.ok) {
        throw new ZeClientError(
          `Unofficial Zé Delivery GraphQL returned HTTP ${response.status} for POST ${PATHS.graphql}. The consumer API is undocumented and may change.`,
          response.status,
          "ZE_UPSTREAM_UNAVAILABLE"
        );
      }
      return parsed;
    } catch (error) {
      if (error instanceof ZeClientError) throw error;
      throw new ZeClientError(
        `Zé Delivery request failed: ${(error as Error).message}`,
        undefined,
        "ZE_UPSTREAM_UNAVAILABLE"
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async resolveAccess(): Promise<ZeTokenSet | null> {
    const file = await this.tokens.read();
    if (file?.access_token) return file;
    const envToken = envAccessToken();
    if (envToken) return { access_token: envToken, source: "user", token_type: "Bearer" };
    return null;
  }
}

export function consumerRequestUrl(apiBase: string, path: string): string {
  try {
    assertAllowedConsumerPath(path);
  } catch (error) {
    throw new ZeClientError((error as Error).message, undefined, "PATH_NOT_ALLOWED");
  }
  const url = apiBase.replace(/\/$/, "") + path;
  if (!isAllowedZeHost(url)) {
    throw new ZeClientError(
      `HOST_NOT_ALLOWED: refusing unofficial Zé Delivery host ${apiBase}`,
      undefined,
      "PATH_NOT_ALLOWED"
    );
  }
  return url;
}
