import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import "../schemas/category.schema";

const router = Router();

// GET /api/categories
router.get("/", categoryController.getList);

// GET /api/categories/:id
router.get("/:id", categoryController.getOne);

export default router;
