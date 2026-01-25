import { Router } from "express";
import { adminOrderController } from "../controllers/admin.order.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/adminMiddleware";
import {
    AdminOrderListQuerySchema,
    UpdateOrderStatusSchema,
    UpdateTrackingSchema,
} from "../schemas/admin.order.schema";
import { validateBody, validateQuery } from "../middlewares/validation.middleware";

const router = Router();

// [공통] 관리자 권한 필수
router.use(authenticateJwt, isAdmin);

// 1. 목록 조회 (Query Param 검증)
router.get("/", validateQuery(AdminOrderListQuerySchema), adminOrderController.getList);

// 2. 상세 조회
router.get("/:id", adminOrderController.getDetail);

// 3. 상태 변경 (Body 검증)
router.patch(
    "/:id/status",
    validateBody(UpdateOrderStatusSchema),
    adminOrderController.updateStatus,
);

// 4. 운송장 입력 (Body 검증)
router.patch(
    "/:id/tracking",
    validateBody(UpdateTrackingSchema),
    adminOrderController.updateTracking,
);

export default router;
