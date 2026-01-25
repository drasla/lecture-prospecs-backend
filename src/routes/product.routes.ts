import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { ProductListQuerySchema } from "../schemas/product.schema";
import { validateQuery } from "../middlewares/validation.middleware"; // 스키마

const router = Router();

// GET /products (Query 파라미터 검증 적용)
router.get("/", validateQuery(ProductListQuerySchema), productController.getProducts);

// GET /products/:id
router.get("/:id", productController.getProductDetail);


export default router;
