import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { CreateOrderSchema, ConfirmOrderSchema, CancelOrderSchema } from "../schemas/order.schema";
import { validateBody } from "../middlewares/validation.middleware";

const router = Router();

// [공통] 로그인 필수
router.use(authenticateJwt);

// 1. 주문 생성 (Body 검증)
router.post("/", validateBody(CreateOrderSchema), orderController.createOrder);

// 2. 목록 조회
router.get("/", orderController.getOrders);

// 3. 결제 승인 (Body 검증)
router.post("/confirm", validateBody(ConfirmOrderSchema), orderController.confirmOrder);

// 4. 상세 조회
router.get("/:id", orderController.getOrderDetail);

// 5. 주문 취소
router.post("/:id/cancel", validateBody(CancelOrderSchema), orderController.cancelOrder);

export default router;
