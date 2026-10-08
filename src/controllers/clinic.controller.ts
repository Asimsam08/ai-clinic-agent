import { Request, Response } from "express";
import {
  getClinic,
  updateClinic,
} from "../services/clinic.service.js";

export async function getClinicDetails(
  req: Request,
  res: Response
) {
  if (!req.auth) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const clinic = await getClinic(req.auth.clinicId);

  return res.status(200).json({
    message: "Clinic fetched successfully",
    data: clinic,
  });
}

export async function updateClinicDetails(
  req: Request,
  res: Response
) {
  if (!req.auth) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const clinic = await updateClinic(
    req.auth.clinicId,
    req.body
  );

  return res.status(200).json({
    message: "Clinic updated successfully",
    data: clinic,
  });
}