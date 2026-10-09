import { z } from "zod";

const timeSchema = z.string().regex(
  /^(?:[01]\d|2[0-3]):[0-5]\d$/,
  "Time must use HH:mm format"
);

const daySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: timeSchema.optional(),
    closeTime: timeSchema.optional(),
    isClosed: z.boolean(),
  })
  .superRefine((day, ctx) => {
    if (day.isClosed) return;

    if (!day.openTime || !day.closeTime) {
      ctx.addIssue({
        code: "custom",
        message: "Opening and closing times are required for an open day",
        path: ["openTime"],
      });
      return;
    }

    if (day.openTime >= day.closeTime) {
      ctx.addIssue({
        code: "custom",
        message: "Closing time must be later than opening time",
        path: ["closeTime"],
      });
    }
  });

export const updateWorkingHoursSchema = z
  .object({
    days: z.array(daySchema).length(7),
  })
  .superRefine((schedule, ctx) => {
    const days = schedule.days.map((day) => day.dayOfWeek);

    if (new Set(days).size !== 7) {
      ctx.addIssue({
        code: "custom",
        message: "Provide each day of the week exactly once",
        path: ["days"],
      });
    }
  });