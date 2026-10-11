import { Request, Response } from "express";
import { createAppointment, getAvailableSlots } from "../services/appointment.service.js";
import { AppError } from "../utils/app.error.js";

export async function checkAvailability(
  req: Request,
  res: Response
) {
  const { date, serviceId, staffId } = req.query;

  if (
    typeof date !== "string" ||
    typeof serviceId !== "string" ||
    (staffId !== undefined && typeof staffId !== "string")
  ) {
    throw new AppError("Invalid availability query parameters", 400);
  }

  const result = await getAvailableSlots({
    clinicId: req.auth!.clinicId,
    date,
    serviceId,
    ...(staffId ? { staffId } : {}),
  });

  return res.status(200).json({
    message: "Availability fetched successfully",
    data: result,
  });
}


export async function createBooking(
  req: Request,
  res: Response
) {
  const { contactId, serviceId, staffId, startAt, notes } = req.body;

  const appointment = await createAppointment({
    clinicId: req.auth!.clinicId,
    contactId,
    serviceId,
    staffId,
    startAt,
    notes,
    source: "DASHBOARD",
  });

  return res.status(201).json({
    message: "Appointment created successfully",
    data: appointment,
  });
}