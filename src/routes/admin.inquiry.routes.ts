import { Router } from "express";
import { inquiryController } from "../controllers/inquiry.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/adminMiddleware";
import { validateBody } from "../middlewares/validation.middleware";
import { AnswerInquirySchema } from "../schemas/inquiry.schema";

const router = Router();

router.use(authenticateJwt, isAdmin);

router.get("/", inquiryController.getAdminList);
router.put("/:id/answer", validateBody(AnswerInquirySchema), inquiryController.answer);

export default router;
