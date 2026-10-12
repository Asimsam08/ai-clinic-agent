
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";

interface CreateMessageInput {
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  senderType: "CUSTOMER" | "OWNER" | "ADMIN" | "AI" | "SYSTEM";
  content: string;
}

export async function createMessage(input: CreateMessageInput) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.findUnique({
      where: { id: input.conversationId },
      select: { id: true },
    });

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const message = await tx.message.create({
      data: {
        conversationId: input.conversationId,
        direction: input.direction,
        senderType: input.senderType,
        content: input.content,
      },
    });

    await tx.conversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    return message;
  });
}
