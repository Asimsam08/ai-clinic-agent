import { z } from "zod";

export const simulatorMessageSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(30, "Phone number is too long"),

  messageText: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
});