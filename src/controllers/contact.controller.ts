
import { Request, Response } from "express";
import { createContact } from "../services/contact.service.js";

export async function createContactHandler(req: Request, res: Response) {
  const result = await createContact({
    clinicId: req.auth!.clinicId,
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    whatsappOptIn: req.body.whatsappOptIn,
  });

  return res.status(result.created ? 201 : 200).json({
    message: result.created
      ? "Contact created successfully"
      : "Contact already exists",
    data: result.contact,
  });
}
