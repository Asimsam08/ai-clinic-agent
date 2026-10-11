import { z } from "zod";

export const availabilityQuerySchema = z.object({
  date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format"
  ),

  serviceId: z.string().uuid("Invalid service ID"),

  staffId: z.string().uuid("Invalid staff ID").optional(),
});

export const createAppointmentSchema = z.object({
  contactId: z.string().uuid("Invalid patient contact ID"),
  serviceId: z.string().uuid("Invalid service ID"),
  staffId: z.string().uuid("Invalid staff ID"),
  startAt: z
    .string()
    .datetime({ offset: true, message: "Provide a valid ISO datetime with timezone" }),
  notes: z.string().max(1000).optional(),
});