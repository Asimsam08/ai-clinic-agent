
import { prisma } from "../db/prisma.js";

export async function expirePendingAppointments(): Promise<number> {
  const now = new Date();

  const expiredAppointments = await prisma.appointment.findMany({
    where: {
      status: "PENDING",
      confirmationExpiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
    },
  });

  let expiredCount = 0;

  for (const appointment of expiredAppointments) {
    await prisma.$transaction(async (tx) => {
      // Recheck the status and expiry inside the transaction.
      // Another request might have confirmed the appointment meanwhile.
      const result = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          status: "PENDING",
          confirmationExpiresAt: {
            lte: new Date(),
          },
        },
        data: {
          status: "CANCELLED",
        },
      });

      // Only write history if this transaction cancelled the appointment.
      if (result.count === 0) {
        return;
      }

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: appointment.id,
          fromStatus: "PENDING",
          toStatus: "CANCELLED",
          reason: "CONFIRMATION_EXPIRED",
        },
      });

      expiredCount++;
    });
  }

  return expiredCount;
}
