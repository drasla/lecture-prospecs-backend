import { Router } from "express";
import { adminProductController } from "../controllers/admin.product.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/adminMiddleware";
import { CreateProductSchema, ProductListQuerySchema } from "../schemas/product.schema";
import { validateBody, validateQuery } from "../middlewares/validation.middleware";

const router = Router();

// [공통 미들웨어] 로그인 & 관리자 권한 필수
router.use(authenticateJwt, isAdmin);

// 1. 상품 생성 (Body 검증)
router.post("/", validateBody(CreateProductSchema), adminProductController.create);

// 2. 상품 목록 조회 (Query 검증 - 페이지네이션, 필터 등)
router.get("/", validateQuery(ProductListQuerySchema), adminProductController.getList);

// 3. 상품 상세 조회
router.get("/:id", adminProductController.getDetail);

// 4. 상품 수정 (Body 검증)
router.put("/:id", validateBody(CreateProductSchema), adminProductController.update);

// 5. 상품 삭제
router.delete("/:id", adminProductController.delete);

export default router;
