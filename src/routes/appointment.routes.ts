import { Router } from "express";
import { checkAvailability, createBooking } from "../controllers/appointment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../middleware/validation.middleware.js";
import { availabilityQuerySchema, createAppointmentSchema } from "../validators/appointment.validator.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/availability",
  validateQuery(availabilityQuerySchema),
  asyncHandler(checkAvailability)
);

router.post(
  "/",
  validateBody(createAppointmentSchema),
  asyncHandler(createBooking)
);

export default router;