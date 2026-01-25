import { Router } from "express";
import { adminCategoryController } from "../controllers/admin.category.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/adminMiddleware";
import { CreateCategorySchema, UpdateCategorySchema } from "../schemas/admin.category.schema";
import { validateBody } from "../middlewares/validation.middleware";

const router = Router();

// [공통] 관리자 권한 체크
router.use(authenticateJwt, isAdmin);

// GET /admin/categories
router.get("/", adminCategoryController.getList);

// POST /admin/categories (Body 검증)
router.post("/", validateBody(CreateCategorySchema), adminCategoryController.create);

// PUT /admin/categories/:id (Body 검증)
router.put("/:id", validateBody(UpdateCategorySchema), adminCategoryController.update);

// DELETE /admin/categories/:id
router.delete("/:id", adminCategoryController.delete);

export default router;
