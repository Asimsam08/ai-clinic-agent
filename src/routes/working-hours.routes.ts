import { Router } from "express";
import {
  listWorkingHours,
  saveWorkingHours,
} from "../controllers/working-hours.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { updateWorkingHoursSchema } from "../validators/working-hours.validator.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listWorkingHours));

router.put(
  "/",
  requireRole("OWNER", "ADMIN"),
  validateBody(updateWorkingHoursSchema),
  asyncHandler(saveWorkingHours)
);

export default router;