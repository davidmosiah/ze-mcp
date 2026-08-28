import assert from "node:assert/strict";
import { PATHS } from "../dist/constants.js";
import { isAllowedConsumerPath, isAllowedZeHost } from "../dist/services/path-allowlist.js";
import { consumerRequestUrl, ZeClientError } from "../dist/services/ze-client.js";

assert.equal(isAllowedConsumerPath(PATHS.graphql), true);
assert.equal(isAllowedZeHost("https://api.ze.delivery/public-api"), true);
assert.equal(isAllowedZeHost("https://evil.example/public-api"), false);
assert.equal(isAllowedConsumerPath("/v2/orders"), false);
assert.equal(isAllowedConsumerPath("https://evil.example/x"), false);
assert.equal(isAllowedConsumerPath("/public-api/../evil"), false);

const base = "https://api.ze.delivery";
assert.equal(consumerRequestUrl(base, PATHS.graphql), `${base}${PATHS.graphql}`);
assert.throws(
  () => consumerRequestUrl(base, "https://evil.example/steal"),
  (err) => err instanceof ZeClientError && err.code === "PATH_NOT_ALLOWED"
);
assert.throws(
  () => consumerRequestUrl(base, "/v2/orders"),
  (err) => err instanceof ZeClientError && err.code === "PATH_NOT_ALLOWED"
);
assert.throws(
  () => consumerRequestUrl("https://evil.example", PATHS.graphql),
  (err) => err instanceof ZeClientError && err.code === "PATH_NOT_ALLOWED"
);

console.log(JSON.stringify({ ok: true, suite: "path-allowlist" }, null, 2));
