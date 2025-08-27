import { z } from "zod";

// Chrome Control Form Schema
export const chromeControlSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().optional(),
});

export type ChromeControlForm = z.infer<typeof chromeControlSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginForm = z.infer<typeof loginSchema>;

// Ad Search Schema
export const adSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  category: z.string().optional(),
  location: z.string().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
});

export type AdSearchForm = z.infer<typeof adSearchSchema>;

// Rule Builder Schema
export const ruleBuilderSchema = z.object({
  trigger: z.enum(["message.new", "price.changed", "ad.updated"]),
  condition: z.object({
    field: z.string(),
    operator: z.enum(["<", ">", "=", "!=", "contains"]),
    value: z.union([z.string(), z.number()]),
  }),
  action: z.object({
    type: z.enum(["notify", "autofav", "email", "webhook"]),
    params: z.record(z.any()).optional(),
  }),
  enabled: z.boolean().default(true),
});

export type RuleBuilderForm = z.infer<typeof ruleBuilderSchema>;
