import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";

export async function getClinic(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: {
      id: clinicId,
    },
  });

  if (!clinic) {
    throw new AppError("Clinic not found", 404);
  }

  return clinic;
}

interface UpdateClinicInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone?: string;
}

export async function updateClinic(
  clinicId: string,
  input: UpdateClinicInput
) {
  const clinic = await prisma.clinic.findUnique({
    where: {
      id: clinicId,
    },
  });

  if (!clinic) {
    throw new AppError("Clinic not found", 404);
  }

  const updatedClinic = await prisma.clinic.update({
    where: {
      id: clinicId,
    },
    data: {
      ...(input.name !== undefined && {
        name: input.name.trim(),
      }),

      ...(input.phone !== undefined && {
        phone: input.phone.trim(),
      }),

      ...(input.email !== undefined && {
        email: input.email.trim().toLowerCase(),
      }),

      ...(input.address !== undefined && {
        address: input.address.trim(),
      }),

      ...(input.timezone !== undefined && {
        timezone: input.timezone.trim(),
      }),
    },
  });

  return updatedClinic;
}