# Mutation gate

`src/services/mutation-gate.ts` is the only place money rules live. Handlers call it **before** `ZeClient` HTTP.

| Tool | `ZE_ALLOW_MUTATIONS` | `explicit_user_intent` | Guest token |
| --- | --- | --- | --- |
| place-order / cancel-order | required | required | rejected |
| logout | no | required | allowed |
