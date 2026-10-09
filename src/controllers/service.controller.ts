import { Request, Response } from "express";
import {
  createService,
  getServices,
  updateService,
} from "../services/clinic-service.service.js";
import { AppError } from "../utils/app.error.js";

export async function listServices(req: Request, res: Response) {
  const clinicId = req.auth!.clinicId;

  const services = await getServices(clinicId);

  return res.status(200).json({
    message: "Services fetched successfully",
    data: services,
  });
}

export async function addService(req: Request, res: Response) {
  const clinicId = req.auth!.clinicId;

  const service = await createService(clinicId, req.body);

  return res.status(201).json({
    message: "Service created successfully",
    data: service,
  });
}

export async function editService(req: Request, res: Response) {
  const clinicId = req.auth!.clinicId;
//   const { serviceId } = req.params;
    const serviceId = req.params.serviceId;

  if (typeof serviceId !== "string") {
    throw new AppError("Invalid service ID", 400);
  }

  const service = await updateService(
    clinicId,
    serviceId,
    req.body
  );

  return res.status(200).json({
    message: "Service updated successfully",
    data: service,
  });
}