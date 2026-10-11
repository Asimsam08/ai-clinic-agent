
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";

interface CreateContactInput {
  clinicId: string;
  name?: string;
  phone: string;
  email?: string;
  whatsappOptIn?: boolean;
}

function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, "");
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createContact(input: CreateContactInput) {
  const { clinicId, name, email, whatsappOptIn } = input;
  const phone = normalizePhone(input.phone);

  const existingContact = await prisma.contact.findUnique({
    where: {
      clinicId_phone: {
        clinicId,
        phone,
      },
    },
  });

  if (existingContact) {
    return { contact: existingContact, created: false };
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        clinicId,
        name,
        phone,
        email,
        whatsappOptIn: whatsappOptIn ?? false,
        type: "PATIENT",
      },
    });

    return { contact, created: true };
  } catch (error) {
    // Handles two requests creating the same phone number concurrently.
    if (isUniqueConstraintError(error)) {
      const contact = await prisma.contact.findUnique({
        where: {
          clinicId_phone: {
            clinicId,
            phone,
          },
        },
      });

      if (contact) {
        return { contact, created: false };
      }
    }

    throw error;
  }
}
