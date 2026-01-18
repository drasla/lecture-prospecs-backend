import { Router } from "express";
import { cartController } from "../controllers/cart.controller";
import { authenticateJwt } from "../middlewares/authMiddleware"; // 로그인 체크 미들웨어

const router = Router();

router.use(authenticateJwt); // 모든 장바구니 요청은 로그인 필요

router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.put("/:id", cartController.updateItem); // 수량 변경
router.delete("/:id", cartController.removeItem);

export default router;
