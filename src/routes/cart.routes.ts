import { Router } from "express";
import { cartController } from "../controllers/cart.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { AddToCartSchema, UpdateCartItemSchema } from "../schemas/cart.schema";
import { validateBody } from "../middlewares/validation.middleware";

const router = Router();

// [공통] 모든 장바구니 기능은 로그인 필요
router.use(authenticateJwt);

// GET /cart
router.get("/", cartController.getCart);

// POST /cart (Body 검증)
router.post("/", validateBody(AddToCartSchema), cartController.addToCart);

// PUT /cart/:id (Body 검증)
router.put("/:id", validateBody(UpdateCartItemSchema), cartController.updateItem);

// DELETE /cart/:id
router.delete("/:id", cartController.removeItem);

export default router;
