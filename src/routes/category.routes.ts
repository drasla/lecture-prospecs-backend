import { Router } from "express";
import { categoryController } from "../controllers/category.controller";

const router = Router();

// GET /api/categories
router.get("/", categoryController.getList);
router.get("/:id", categoryController.getOne);

export default router;