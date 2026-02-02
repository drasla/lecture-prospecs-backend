import { Router } from "express";
import { inquiryController } from "../controllers/inquiry.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { validateBody } from "../middlewares/validation.middleware";
import { CreateInquirySchema } from "../schemas/inquiry.schema";

const router = Router();

router.get("/me", authenticateJwt, inquiryController.getMyList);
router.get("/:id", authenticateJwt, inquiryController.getDetail);
router.post("/", authenticateJwt, validateBody(CreateInquirySchema), inquiryController.create);

export default router;
