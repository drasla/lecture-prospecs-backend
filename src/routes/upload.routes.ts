import { Router } from "express";
import multer from "multer";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { uploadController } from "../controllers/upload.controller";
import "../schemas/upload.schema";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateJwt);

router.post("/", upload.single("file"), uploadController.uploadImage);

export default router;
