import {Router} from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
const router  = Router()

router.post("/register", validateBody(registerSchema),  asyncHandler(register));
router.post("/login", validateBody(loginSchema),  asyncHandler(login));
router.get("/me", authMiddleware,  asyncHandler(me));

export default router

