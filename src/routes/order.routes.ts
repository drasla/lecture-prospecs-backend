import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateJwt); // 로그인 필수

router.post("/", orderController.createOrder); // 주문 생성
router.get("/", orderController.getOrders); // 목록 조회
router.post("/confirm", orderController.confirmOrder);
router.get("/:id", orderController.getOrderDetail); // 상세 조회

export default router;
