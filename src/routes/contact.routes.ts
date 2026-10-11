
import { Router } from "express";
import { createContactHandler } from "../controllers/contact.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { createContactSchema } from "../validators/contact.validator.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validateBody(createContactSchema),
  asyncHandler(createContactHandler),
);

export default router;
