import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";
import { fromZonedTime } from "date-fns-tz";

interface AvailabilityInput {
  clinicId: string;
  date: string; // YYYY-MM-DD in the clinic's timezone
  serviceId: string;
  staffId?: string;
}

const SLOT_INTERVAL_MINUTES = 15;

export async function getAvailableSlots(input: AvailabilityInput) {
  const { clinicId, date, serviceId, staffId } = input;

  // Validate that the date is a real calendar date.
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(date)) {
    throw new AppError("Date must use YYYY-MM-DD format", 400);
  }

  const [year, month, day] = date.split("-").map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    throw new AppError("Invalid calendar date", 400);
  }

  const clinic = await prisma.clinic.findFirst({
    where: {
      id: clinicId,
      isActive: true,
    },
    select: {
      timezone: true,
    },
  });

  if (!clinic) {
    throw new AppError("Clinic not found or inactive", 404);
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      clinicId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
    },
  });

  if (!service) {
    throw new AppError("Active service not found", 404);
  }

  // Convert the requested clinic-local date to UTC boundaries.
  const dayStart = fromZonedTime(
    `${date}T00:00:00`,
    clinic.timezone
  );

  const nextDate = new Date(calendarDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const nextDateString = [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDate.getUTCDate()).padStart(2, "0"),
  ].join("-");

  const dayEnd = fromZonedTime(
    `${nextDateString}T00:00:00`,
    clinic.timezone
  );

  const dayOfWeek = calendarDate.getUTCDay();

  const [workingHour, exception, staffMembers] = await Promise.all([
    prisma.workingHour.findUnique({
      where: {
        clinicId_dayOfWeek: {
          clinicId,
          dayOfWeek,
        },
      },
    }),

    prisma.availabilityException.findFirst({
      where: {
        clinicId,
        date: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    }),

    prisma.staff.findMany({
      where: {
        clinicId,
        isActive: true,
        ...(staffId ? { id: staffId } : {}),
      },
      select: {
        id: true,
        name: true,
        title: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (staffId && staffMembers.length === 0) {
    throw new AppError("Active staff member not found", 404);
  }

  // A date-specific exception overrides the normal weekly schedule.
  if (
    (exception && exception.isClosed) ||
    (!exception && (!workingHour || workingHour.isClosed))
  ) {
    return {
      date,
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
      },
      slots: [],
    };
  }

  const openTime = exception?.openTime ?? workingHour?.openTime;
  const closeTime = exception?.closeTime ?? workingHour?.closeTime;

  if (!openTime || !closeTime) {
    return {
      date,
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
      },
      slots: [],
    };
  }

  const openingTime = fromZonedTime(
    `${date}T${openTime}:00`,
    clinic.timezone
  );

  const closingTime = fromZonedTime(
    `${date}T${closeTime}:00`,
    clinic.timezone
  );

  if (closingTime <= openingTime) {
    throw new AppError("Invalid clinic opening hours", 500);
  }

  // Fetch appointments that overlap the clinic's operating window.
  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      startAt: {
        lt: closingTime,
      },
      endAt: {
        gt: openingTime,
      },
      ...(staffId ? { staffId } : {}),
    },
    select: {
      staffId: true,
      startAt: true,
      endAt: true,
    },
  });

  const slots: {
    startAt: string;
    endAt: string;
    availableStaff: typeof staffMembers;
  }[] = [];

  const durationMs = service.durationMinutes * 60_000;
  const intervalMs = SLOT_INTERVAL_MINUTES * 60_000;

  for (
    let startMs = openingTime.getTime();
    startMs + durationMs <= closingTime.getTime();
    startMs += intervalMs
  ) {
    const startAt = new Date(startMs);
    const endAt = new Date(startMs + durationMs);

    // Never offer appointments that start in the past.
    if (startAt <= new Date()) {
      continue;
    }

    const availableStaff = staffMembers.filter((staff) => {
      return !appointments.some((appointment) => {
        if (appointment.staffId !== staff.id) {
          return false;
        }

        // Two intervals overlap when each starts before the other ends.
        return (
          appointment.startAt < endAt &&
          appointment.endAt > startAt
        );
      });
    });

    if (availableStaff.length > 0) {
      slots.push({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        availableStaff,
      });
    }
  }

  return {
    date,
    timezone: clinic.timezone,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
    },
    slots,
  };
}