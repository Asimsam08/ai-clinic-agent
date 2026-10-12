import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

interface AvailabilityInput {
  clinicId: string;
  date: string; // YYYY-MM-DD in the clinic's timezone
  serviceId: string;
  staffId?: string;
}

interface CreateAppointmentInput {
  clinicId: string;
  contactId: string;
  serviceId: string;
  staffId: string;
  startAt: string;
  notes?: string;
  source?: string;
}

const SLOT_INTERVAL_MINUTES = 15;
const PENDING_HOLD_MINUTES = 15;

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
  const dayStart = fromZonedTime(`${date}T00:00:00`, clinic.timezone);

  const nextDate = new Date(calendarDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const nextDateString = [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDate.getUTCDate()).padStart(2, "0"),
  ].join("-");

  const dayEnd = fromZonedTime(`${nextDateString}T00:00:00`, clinic.timezone);

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

  const openingTime = fromZonedTime(`${date}T${openTime}:00`, clinic.timezone);

  const closingTime = fromZonedTime(`${date}T${closeTime}:00`, clinic.timezone);

  if (closingTime <= openingTime) {
    throw new AppError("Invalid clinic opening hours", 500);
  }

  // Fetch appointments that overlap the clinic's operating window.
  // const appointments = await prisma.appointment.findMany({
  //   where: {
  //     clinicId,
  //     status: {
  //       in: ["PENDING", "CONFIRMED"],
  //     },
  //     startAt: {
  //       lt: closingTime,
  //     },
  //     endAt: {
  //       gt: openingTime,
  //     },
  //     ...(staffId ? { staffId } : {}),
  //   },
  //   select: {
  //     staffId: true,
  //     startAt: true,
  //     endAt: true,
  //   },
  // });
  const now = new Date();
  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      OR: [
        { status: "CONFIRMED" },
        {
          status: "PENDING",
          confirmationExpiresAt: { gt: now },
        },
      ],
      startAt: { lt: closingTime },
      endAt: { gt: openingTime },
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
        return appointment.startAt < endAt && appointment.endAt > startAt;
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

const MAX_TRANSACTION_ATTEMPTS = 3;

function isSerializationConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export async function createAppointment(input: CreateAppointmentInput) {
  const {
    clinicId,
    contactId,
    serviceId,
    staffId,
    startAt: requestedStartAt,
    notes,
    source,
  } = input;

  // 1. Validate the requested start time.
  const startAt = new Date(requestedStartAt);

  if (
    !Number.isFinite(startAt.getTime()) ||
    !requestedStartAt.includes("T") ||
    !/(Z|[+-]\d{2}:\d{2})$/i.test(requestedStartAt)
  ) {
    throw new AppError(
      "startAt must be a valid ISO datetime with a timezone",
      400,
    );
  }

  // 2. Get the clinic timezone.
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

  // 3. Check whether the requested time is a valid,
  // currently available candidate for this service and dentist.
  const date = formatInTimeZone(startAt, clinic.timezone, "yyyy-MM-dd");

  const availability = await getAvailableSlots({
    clinicId,
    date,
    serviceId,
    staffId,
  });

  const selectedSlot = availability.slots.find(
    (slot) =>
      new Date(slot.startAt).getTime() === startAt.getTime() &&
      slot.availableStaff.some((staff) => staff.id === staffId),
  );

  if (!selectedSlot) {
    throw new AppError("The selected appointment slot is unavailable", 409);
  }

  const endAt = new Date(
    startAt.getTime() + availability.service.durationMinutes * 60_000,
  );

  // 4. Recheck important records and create the booking
  // inside a serializable database transaction.
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const contact = await tx.contact.findFirst({
            where: {
              id: contactId,
              clinicId,
              type: "PATIENT",
            },
            select: { id: true },
          });

          if (!contact) {
            throw new AppError("Patient contact not found in this clinic", 404);
          }

          const service = await tx.service.findFirst({
            where: {
              id: serviceId,
              clinicId,
              isActive: true,
            },
            select: {
              id: true,
              durationMinutes: true,
            },
          });

          if (!service) {
            throw new AppError("Active service not found", 404);
          }

          if (
            service.durationMinutes !== availability.service.durationMinutes
          ) {
            throw new AppError(
              "Service details changed. Check availability again.",
              409,
            );
          }

          const staff = await tx.staff.findFirst({
            where: {
              id: staffId,
              clinicId,
              isActive: true,
            },
            select: { id: true },
          });

          if (!staff) {
            throw new AppError(
              "Active staff member not found in this clinic",
              404,
            );
          }

          // A booking conflicts if the existing appointment
          // starts before our end AND ends after our start.

          const now = new Date();

          const conflictingAppointment = await tx.appointment.findFirst({
            where: {
              clinicId,
              staffId,
              OR: [
                { status: "CONFIRMED" },
                {
                  status: "PENDING",
                  confirmationExpiresAt: { gt: now },
                },
              ],
              startAt: { lt: endAt },
              endAt: { gt: startAt },
            },
            select: { id: true },
          });

          if (conflictingAppointment) {
            throw new AppError(
              "This dentist has already been booked for that time",
              409,
            );
          }

          // return tx.appointment.create({
          //   data: {
          //     clinicId,
          //     contactId,
          //     serviceId,
          //     staffId,
          //     startAt,
          //     endAt,
          //     notes,
          //     source: source ?? "DASHBOARD",
          //     status: "PENDING",
          //   },
          //   include: {
          //     contact: {
          //       select: {
          //         id: true,
          //         name: true,
          //         phone: true,
          //       },
          //     },
          //     service: {
          //       select: {
          //         id: true,
          //         name: true,
          //         durationMinutes: true,
          //       },
          //     },
          //     staff: {
          //       select: {
          //         id: true,
          //         name: true,
          //       },
          //     },
          //   },
          // });

          const confirmationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

          const appointment = await tx.appointment.create({
            data: {
              clinicId,
              contactId,
              serviceId,
              staffId,
              startAt,
              endAt,
              notes,
              source: source ?? "DASHBOARD",
              status: "PENDING",
              confirmationExpiresAt,
            },
            include: {
              contact: {
                select: { id: true, name: true, phone: true },
              },
              service: {
                select: { id: true, name: true, durationMinutes: true },
              },
              staff: {
                select: { id: true, name: true },
              },
            },
          });

          await tx.appointmentStatusHistory.create({
            data: {
              appointmentId: appointment.id,
              fromStatus: null,
              toStatus: "PENDING",
              reason: "BOOKING_CREATED",
            },
          });

          return appointment;
        },

        {
          isolationLevel: "Serializable",
        },
      );
    } catch (error) {
      if (isSerializationConflict(error)) {
        if (attempt < MAX_TRANSACTION_ATTEMPTS) {
          continue;
        }

        throw new AppError(
          "The appointment could not be reserved safely. Please check availability again.",
          409,
        );
      }

      throw error;
    }
  }

  throw new AppError("Unable to create appointment", 409);
}


interface ConfirmPatientAppointmentInput {
  clinicId: string;
  contactId: string;
  appointmentId: string;
}

export async function confirmPatientAppointment(
  input: ConfirmPatientAppointmentInput,
) {
  const { clinicId, contactId, appointmentId } = input;

  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId,
        contactId,
      },
      select: {
        id: true,
        status: true,
        confirmationExpiresAt: true,
      },
    });

    if (!appointment) {
      throw new AppError(
        "Appointment not found for this patient and clinic",
        404,
      );
    }

    // Clicking Confirm again should not change the existing booking.
    if (appointment.status === "CONFIRMED") {
      return {
        outcome: "ALREADY_CONFIRMED" as const,
        appointmentId: appointment.id,
      };
    }

    if (appointment.status !== "PENDING") {
      throw new AppError(
        `This appointment cannot be confirmed because its status is ${appointment.status}`,
        409,
      );
    }

    const now = new Date();
    const hasExpired =
      !appointment.confirmationExpiresAt ||
      appointment.confirmationExpiresAt <= now;

    if (hasExpired) {
      const cancelled = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          clinicId,
          contactId,
          status: "PENDING",
          OR: [
            { confirmationExpiresAt: { lte: now } },
            { confirmationExpiresAt: null },
          ],
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (cancelled.count === 0) {
        throw new AppError(
          "The appointment changed while confirmation was processing. Please check its status.",
          409,
        );
      }

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: appointment.id,
          fromStatus: "PENDING",
          toStatus: "CANCELLED",
          reason: "CONFIRMATION_EXPIRED",
        },
      });

      return {
        outcome: "EXPIRED" as const,
        appointmentId: appointment.id,
      };
    }

    // Confirm only if the appointment is still pending
    // and its hold is still valid at the time of the update.
    const confirmed = await tx.appointment.updateMany({
      where: {
        id: appointment.id,
        clinicId,
        contactId,
        status: "PENDING",
        confirmationExpiresAt: { gt: now },
      },
      data: {
        status: "CONFIRMED",
      },
    });

    if (confirmed.count === 0) {
      throw new AppError(
        "The appointment changed while confirmation was processing. Please check its status.",
        409,
      );
    }

    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        fromStatus: "PENDING",
        toStatus: "CONFIRMED",
        reason: "PATIENT_CONFIRMED",
      },
    });

    return {
      outcome: "CONFIRMED" as const,
      appointmentId: appointment.id,
    };
  });
}