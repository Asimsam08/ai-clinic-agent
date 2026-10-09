import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";

interface CreateStaffInput {
  name: string;
  title?: string;
  phone?: string;
  email?: string;
}

interface UpdateStaffInput {
  name?: string;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}

export async function getStaffMembers(clinicId: string) {
  return prisma.staff.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStaffMember(
  clinicId: string,
  input: CreateStaffInput
) {
  return prisma.staff.create({
    data: {
      clinicId,
      name: input.name,
      title: input.title,
      phone: input.phone,
      email: input.email?.toLowerCase(),
    },
  });
}

export async function updateStaffMember(
  clinicId: string,
  staffId: string,
  input: UpdateStaffInput
) {
  const existingStaff = await prisma.staff.findFirst({
    where: {
      id: staffId,
      clinicId,
    },
  });

  if (!existingStaff) {
    throw new AppError("Staff member not found", 404);
  }

  return prisma.staff.update({
    where: { id: existingStaff.id },
    data: {
      ...input,
      ...(input.email !== undefined && {
        email: input.email?.toLowerCase() ?? null,
      }),
    },
  });
}