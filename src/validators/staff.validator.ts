import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  title: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  email: z.string().trim().email().optional(),
});

export const updateStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    title: z.string().trim().max(100).nullable().optional(),
    phone: z.string().trim().min(5).max(30).nullable().optional(),
    email: z.string().trim().email().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });