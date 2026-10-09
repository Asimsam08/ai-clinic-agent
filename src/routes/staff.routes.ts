import  { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { listStaff, addStaff,editStaff } from "../controllers/staff.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireRole } from "../middleware/role.middleware.js";
import { createStaffSchema, updateStaffSchema } from "../validators/staff.validator.js";
import { validateBody } from "../middleware/validation.middleware.js";
const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listStaff));
router.post("/", requireRole("OWNER", "ADMIN"), validateBody(createStaffSchema),asyncHandler(addStaff));
router.patch("/:staffId",    requireRole("OWNER", "ADMIN"),  validateBody(updateStaffSchema), asyncHandler(editStaff));

export default router;