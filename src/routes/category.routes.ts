import { Router } from "express";
import { categoryController } from "../controllers/category.controller";

const router = Router();

// GET /api/categories
router.get("/", categoryController.getList);

export default router;