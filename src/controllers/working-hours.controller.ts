import { Request, Response } from "express";
import {
  getWorkingHours,
  updateWorkingHours,
} from "../services/working-hours.service.js";

export async function listWorkingHours(req: Request, res: Response) {
  const schedule = await getWorkingHours(req.auth!.clinicId);

  return res.status(200).json({
    message: "Working hours fetched successfully",
    data: schedule,
  });
}

export async function saveWorkingHours(req: Request, res: Response) {
  const schedule = await updateWorkingHours(
    req.auth!.clinicId,
    req.body.days
  );

  return res.status(200).json({
    message: "Working hours updated successfully",
    data: schedule,
  });
}