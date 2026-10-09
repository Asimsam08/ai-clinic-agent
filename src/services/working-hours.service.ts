import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";

interface WorkingDayInput {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

export async function getWorkingHours(clinicId: string) {
  return prisma.workingHour.findMany({
    where: { clinicId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function updateWorkingHours(
  clinicId: string,
  days: WorkingDayInput[]
) {
  if (days.length !== 7 || new Set(days.map((day) => day.dayOfWeek)).size !== 7) {
    throw new AppError("A complete seven-day schedule is required", 400);
  }

  return prisma.$transaction(
    days.map((day) =>
      prisma.workingHour.upsert({
        where: {
          clinicId_dayOfWeek: {
            clinicId,
            dayOfWeek: day.dayOfWeek,
          },
        },
        create: {
          clinicId,
          dayOfWeek: day.dayOfWeek,
          isClosed: day.isClosed,
          openTime: day.isClosed ? "" : day.openTime!,
          closeTime: day.isClosed ? "" : day.closeTime!,
        },
        update: {
          isClosed: day.isClosed,
          openTime: day.isClosed ? "" : day.openTime!,
          closeTime: day.isClosed ? "" : day.closeTime!,
        },
      })
    )
  );
}