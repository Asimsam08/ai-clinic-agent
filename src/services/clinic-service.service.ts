import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";

interface CreateServiceInput {
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
}

interface UpdateServiceInput {
  name?: string;
  description?: string | null;
  durationMinutes?: number;
  price?: number | null;
  isActive?: boolean;
}

export async function getServices(clinicId: string) {
  return prisma.service.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createService(
  clinicId: string,
  input: CreateServiceInput
) {
  return prisma.service.create({
    data: {
      clinicId,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      price: input.price,
    },
  });
}

export async function updateService(
  clinicId: string,
  serviceId: string,
  input: UpdateServiceInput
) {
  const existingService = await prisma.service.findFirst({
    where: {
      id: serviceId,
      clinicId,
    },
  });

  if (!existingService) {
    throw new AppError("Service not found", 404);
  }

  return prisma.service.update({
    where: { id: existingService.id },
    data: input,
  });
}