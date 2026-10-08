import { z } from "zod";

export const updateClinicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Clinic name must be at least 2 characters")
    .max(150, "Clinic name must not exceed 150 characters")
    .optional(),

  phone: z
    .string()
    .trim()
    .min(5, "Invalid phone number")
    .max(30, "Invalid phone number")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Invalid clinic email")
    .optional(),

  address: z
    .string()
    .trim()
    .max(500, "Address is too long")
    .optional(),

  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .optional(),
});