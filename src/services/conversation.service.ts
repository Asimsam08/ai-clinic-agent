
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";

interface GetOrCreateConversationInput {
  clinicId: string;
  contactId: string;
  channel: "SIMULATOR" | "WHATSAPP";
  whatsappAccountId?: string;
}

export async function getOrCreateConversation(
  input: GetOrCreateConversationInput,
) {
  const { clinicId, contactId, channel, whatsappAccountId } = input;

  // Verify that the patient belongs to this clinic.
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      clinicId,
      type: "PATIENT",
    },
    select: {
      id: true,
    },
  });

  if (!contact) {
    throw new AppError(
      "Patient contact not found in this clinic",
      404,
    );
  }

  // Reuse the most recently active conversation for this channel.
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      clinicId,
      contactId,
      channel,
      status: "ACTIVE",
      ...(channel === "WHATSAPP"
        ? { whatsappAccountId }
        : {}),
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  });

  if (existingConversation) {
    return {
      conversation: existingConversation,
      created: false,
    };
  }

  const conversation = await prisma.conversation.create({
    data: {
      clinicId,
      contactId,
      channel,
      ...(channel === "WHATSAPP"
        ? { whatsappAccountId }
        : {}),
      status: "ACTIVE",
    },
  });

  return {
    conversation,
    created: true,
  };
}
