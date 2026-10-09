import { Request, Response } from "express";
import {
  createStaffMember,
  getStaffMembers,
  updateStaffMember,
} from "../services/staff.service.js";
import { AppError } from "../utils/app.error.js";

export async function listStaff(req: Request, res: Response) {
  const staff = await getStaffMembers(req.auth!.clinicId);

  return res.status(200).json({
    message: "Staff fetched successfully",
    data: staff,
  });
}

export async function addStaff(req: Request, res: Response) {
  const staff = await createStaffMember(
    req.auth!.clinicId,
    req.body
  );

  return res.status(201).json({
    message: "Staff member created successfully",
    data: staff,
  });
}

export async function editStaff(req: Request, res: Response) {
  const staffId = req.params.staffId;

  if (typeof staffId !== "string") {
    throw new AppError("Invalid staff ID", 400);
  }

  const staff = await updateStaffMember(
    req.auth!.clinicId,
    staffId,
    req.body
  );

  return res.status(200).json({
    message: "Staff member updated successfully",
    data: staff,
  });
}