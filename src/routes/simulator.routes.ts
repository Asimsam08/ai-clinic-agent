
import { Router } from "express";
import { confirmSimulatedAppointment, receiveSimulatorMessage } from "../controllers/simulator.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.post(
  "/conversations/:conversationId/appointments/:appointmentId/confirm",
  asyncHandler(confirmSimulatedAppointment),
);

router.post(
  "/clinics/:clinicId/messages",
  receiveSimulatorMessage,
);

export default router;
