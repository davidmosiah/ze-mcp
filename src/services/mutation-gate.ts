export const USER_ACTION_REQUIRED = "USER_ACTION_REQUIRED";

export class MutationGateError extends Error {
  readonly code = USER_ACTION_REQUIRED;

  constructor(message: string) {
    super(message);
    this.name = "MutationGateError";
  }
}

export interface GateInput {
  allowMutations: boolean;
  explicitUserIntent?: boolean;
}

function intentOn(value: boolean | undefined): boolean {
  return value === true;
}

export function assertExplicitIntent(explicitUserIntent: boolean | undefined, action: string): void {
  if (!intentOn(explicitUserIntent)) {
    throw new MutationGateError(
      `${USER_ACTION_REQUIRED}: explicit_user_intent must be true to ${action}. Confirm with the user first.`
    );
  }
}

export function assertMutationsEnabled(allowMutations: boolean, action: string): void {
  if (!allowMutations) {
    throw new MutationGateError(
      `${USER_ACTION_REQUIRED}: ZE_ALLOW_MUTATIONS=true is required to ${action}. Default is read-only and never pays.`
    );
  }
}

export function assertPlaceOrderAllowed(input: GateInput): void {
  assertMutationsEnabled(input.allowMutations, "place a Zé Delivery order or charge money");
  assertExplicitIntent(input.explicitUserIntent, "place a Zé Delivery order or charge money");
}

export function assertCancelOrderAllowed(input: GateInput): void {
  assertMutationsEnabled(input.allowMutations, "cancel a Zé Delivery order");
  assertExplicitIntent(input.explicitUserIntent, "cancel a Zé Delivery order");
}

export function assertChargeWriteAllowed(input: GateInput): void {
  assertMutationsEnabled(input.allowMutations, "change Zé Delivery payment or charge money");
  assertExplicitIntent(input.explicitUserIntent, "change Zé Delivery payment or charge money");
}

export function assertLogoutAllowed(explicitUserIntent: boolean | undefined): void {
  assertExplicitIntent(explicitUserIntent, "clear the local Zé Delivery token");
}

export function assertNotGuestForCharge(source: string | undefined): void {
  if (source === "guest") {
    throw new MutationGateError(
      `${USER_ACTION_REQUIRED}: a guest token cannot place, cancel, or charge a Zé Delivery order. Auth with a personal Zé access token first.`
    );
  }
}
