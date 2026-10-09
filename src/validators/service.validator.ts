import { z } from "zod";

export const createServiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(150),

  description: z.string().trim().max(1000).optional(),

  durationMinutes: z
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration cannot exceed 8 hours"),

  price: z.number().finite().nonnegative("Price cannot be negative").optional(),
});

export const updateServiceSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),

    description: z.string().trim().max(1000).nullable().optional(),

    durationMinutes: z.number().int().min(5).max(480).optional(),

    price: z.number().finite().nonnegative().nullable().optional(),

    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
