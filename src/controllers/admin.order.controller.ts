import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import {
    AdminOrderListQuery,
    UpdateOrderStatusInput,
    UpdateTrackingInput,
} from "../schemas/admin.order.schema";
import { HttpException } from "../utils/exception.utils";

export const adminOrderController = {
    // 목록 조회
    getList: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // validateQuery 미들웨어로 변환된 query 사용
            const query = req.query as unknown as AdminOrderListQuery;
            const result = await orderService.getAdminOrders(query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // 상세 조회
    getDetail: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) throw new HttpException(400, "Invalid ID");

            const order = await orderService.getAdminOrderDetail(id);
            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },

    // 상태 변경
    updateStatus: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const { status } = req.body as UpdateOrderStatusInput;

            const order = await orderService.updateStatus(id, status);
            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },

    // 운송장 입력
    updateTracking: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const data = req.body as UpdateTrackingInput;

            const order = await orderService.updateTracking(id, data);
            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },
};
