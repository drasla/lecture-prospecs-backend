// src/routes/auth.routes.ts
import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { validateBody } from "../middlewares/validation.middleware";
import { LoginSchema, RegisterSchema } from "../schemas/auth.schema"; // 스키마 import

const router = Router();

router.post("/register", validateBody(RegisterSchema), authController.register);
router.post("/login", validateBody(LoginSchema), authController.login);

router.get("/me", authenticateJwt, authController.getMe);

export default router;
