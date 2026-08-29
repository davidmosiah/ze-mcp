## 0.1.2 - 2026-08-28

Skill layer ships in-package (`skill/SKILL.md`). Agents can use MCP tools **or** `call <tool> --json` on the same binary; mutation gates are identical. Default docs still do not contain a copyable mutations assignment.

## 0.1.1 - 2026-08-28

Search, order history and track GraphQL now select live-probed item/order/status fields instead of `__typename` stubs.

- `searchProducts` → `items { id displayName }` (JSON 200)
- `listOrders` → `id number createdDate totalPrice statusesHistory { status createdDate } lineItems { id displayName }` (JSON 401 without token)
- `loadOrder` → `order { number createdDate totalPrice statusesHistory { status createdDate } lineItems { id displayName } }` (JSON 401 without token)
- `loadCategory` → `products { items { id displayName } }`
- client-paths test imports shipped `QUERIES` and fails if those selections regress to `__typename`.

## 0.1.0 - 2026-08-28

Unofficial local-first Zé Delivery MCP (stdio + optional loopback HTTP).

### Live-probed operations (JSON 200/400/401 on POST /public-api)

Host `https://api.ze.delivery`:

- `listCategories` / `listRootProductGroups` (catalog)
- `searchProducts(queryTerm: String!)`
- `loadCategory(filter: { categoryId: Int! })`
- `listOrders` / `loadOrder(orderNumber)` / `loadOrderv2`
- Mutations: `createOrder(input: CreateOrderInput!)`, `cancelOrder(orderNumber: String!)`

`pocSearch` is gone (`Did you mean newSearch or search?`) and was **not** shipped.

### Added

- Read: catalog categories/groups, product search, order history, track.
- Place/cancel fail-closed unless `ZE_ALLOW_MUTATIONS` and `explicit_user_intent`. Guest cannot charge.
- Token file `~/.ze-mcp/tokens.json` mode 0600. `auth --from-header` strips Bearer.
- Host + path allowlist; Origin check on optional HTTP; default bind 127.0.0.1.
- Default privacy redacts street/phone/email/GPS polyline.

### Out of scope

Wellness registry, Keeta, 99Food, partner B2B.
