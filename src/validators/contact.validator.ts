
import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20),
  email: z.string().email().optional(),
  whatsappOptIn: z.boolean().optional(),
});
