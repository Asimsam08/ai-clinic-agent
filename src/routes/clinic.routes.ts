import {Router} from "express";
import { getClinicDetails, updateClinicDetails } from "../controllers/clinic.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validateBody } from "../middleware/validation.middleware.js";
import {updateClinicSchema} from "../validators/clinic.validator.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router()

router.get("/",authMiddleware, asyncHandler(getClinicDetails))
router.patch("/", authMiddleware, requireRole("OWNER", "ADMIN"),validateBody(updateClinicSchema), asyncHandler(updateClinicDetails))

export default router