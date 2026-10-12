
import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app.error.js";
import { confirmPatientAppointment } from "../services/appointment.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { simulatorMessageSchema } from "../validators/simulator.validator.js";
import { receivePatientMessage } from "../services/inbound-message.service.js";

export async function confirmSimulatedAppointment(
  req: Request,
  res: Response,
) {
  const { conversationId, appointmentId } = req.params;

  if (
    typeof conversationId !== "string" ||
    typeof appointmentId !== "string"
  ) {
    throw new AppError("Invalid confirmation request", 400);
  }

  // Resolve the patient and clinic from the stored conversation.
  // Do not trust clinicId or contactId from the browser.
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      channel: "SIMULATOR",
    },
    select: {
      id: true,
      clinicId: true,
      contactId: true,
    },
  });

  if (!conversation) {
    throw new AppError("Simulator conversation not found", 404);
  }

  const result = await confirmPatientAppointment({
    clinicId: conversation.clinicId,
    contactId: conversation.contactId,
    appointmentId,
  });

  let reply: string;

  switch (result.outcome) {
    case "CONFIRMED":
      reply =
        "Your appointment is confirmed! We look forward to seeing you.";
      break;

    case "ALREADY_CONFIRMED":
      reply = "Your appointment is already confirmed.";
      break;

    case "EXPIRED":
      reply =
        "Your booking hold has expired. Would you like me to check availability and help you book another slot?";
      break;
  }

  // Persist the reply in the same conversation.
  const message = await prisma.$transaction(async (tx) => {
    const savedMessage = await tx.message.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        senderType: "AI",
        content: reply,
      },
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return savedMessage;
  });

  return res.status(200).json({
    message: "Confirmation request processed",
    data: {
      outcome: result.outcome,
      appointmentId: result.appointmentId,
      reply: message.content,
      messageId: message.id,
    },
  });
}



export const receiveSimulatorMessage = asyncHandler(
  async (req: Request, res: Response) => {
    // 1. Validate the clinic ID from the URL.
    const clinicId = req.params.clinicId;

    if (typeof clinicId !== "string" || !clinicId.trim()) {
      throw new AppError("Valid clinic ID is required", 400);
    }

    // 2. Validate the incoming request body.
    const parsed = simulatorMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues.map((issue) => issue.message).join(", "),
        400,
      );
    }

    const { phone, messageText } = parsed.data;

    // 3. Make sure the clinic exists and is active.
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!clinic) {
      throw new AppError("Clinic not found or inactive", 404);
    }

    // 4. Find/create contact, conversation, and message.
    const result = await receivePatientMessage({
      clinicId: clinic.id,
      phone,
      messageText,
    });

    // 5. Return the saved message.
    res.status(201).json({
      success: true,
      message: "Patient message received successfully",
      data: {
        contactId: result.contact.id,
        conversationId: result.conversation.id,
        message: result.message,
      },
    });
  },
);