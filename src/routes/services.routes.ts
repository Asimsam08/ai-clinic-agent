import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { createServiceSchema, updateServiceSchema } from "../validators/service.validator.js";
import { listServices, addService, editService } from "../controllers/service.controller.js";

const router = Router();


router.get("/", authMiddleware, asyncHandler(listServices));
router.post("/", authMiddleware, requireRole("OWNER", "ADMIN"), validateBody(createServiceSchema), asyncHandler(addService));
router.patch("/:serviceId", authMiddleware, requireRole("OWNER", "ADMIN"), validateBody(updateServiceSchema), asyncHandler(editService));


export default router;