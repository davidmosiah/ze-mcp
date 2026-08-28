import { z } from "zod";

export const ResponseFormatSchema = z.enum(["markdown", "json"]).default("markdown");
export const PrivacyModeSchema = z.enum(["summary", "structured", "raw"]).optional();

const Intent = z
  .boolean()
  .default(false)
  .describe("Must be true after the user explicitly asked for this write.");

export const ResponseOnlyInputSchema = z
  .object({
    response_format: ResponseFormatSchema
  })
  .strict();

export const ReadInputSchema = z
  .object({
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const SearchInputSchema = z
  .object({
    query: z.string().min(1),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const CategoryInputSchema = z
  .object({
    category_id: z.number().int(),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const OrderIdInputSchema = z
  .object({
    order_id: z.string().min(1),
    privacy_mode: PrivacyModeSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const LogoutInputSchema = z
  .object({
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();

export const PlaceOrderInputSchema = z
  .object({
    input: z.record(z.string(), z.unknown()).optional(),
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();

export const CancelOrderInputSchema = z
  .object({
    order_id: z.string().min(1),
    explicit_user_intent: Intent,
    response_format: ResponseFormatSchema
  })
  .strict();
