import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { CreateOrderInput, ConfirmOrderInput, CancelOrderInput } from "../schemas/order.schema";
import { HttpException } from "../utils/exception.utils";

export const orderController = {
    // 주문 생성
    createOrder: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            // 미들웨어 검증된 body
            const input = req.body as CreateOrderInput;

            const order = await orderService.createOrder(userId, input);

            res.status(201).json(order);
        } catch (error) {
            next(error);
        }
    },

    // 내 주문 목록
    getOrders: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const orders = await orderService.getMyOrders(userId);
            res.status(200).json(orders);
        } catch (error) {
            next(error);
        }
    },

    // 주문 상세
    getOrderDetail: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const orderId = Number(req.params.id);
            if (isNaN(orderId)) throw new HttpException(400, "Invalid Order ID");

            const order = await orderService.getOrderDetail(userId, orderId);
            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },

    // 결제 승인 요청
    confirmOrder: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { paymentKey, orderId, amount } = req.body as ConfirmOrderInput;

            const order = await orderService.confirmOrder(paymentKey, orderId, amount);

            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },

    // 주문 취소
    cancelOrder: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const orderId = Number(req.params.id);
            if (isNaN(orderId)) throw new HttpException(400, "Invalid Order ID");

            // Body에서 사유 가져오기
            const { reason } = req.body as CancelOrderInput;

            const result = await orderService.cancelOrder(userId, orderId, reason);

            res.status(200).json({
                message: "주문이 정상적으로 취소되었습니다.",
                orderId: result.id,
                status: result.status,
            });
        } catch (error) {
            next(error);
        }
    },
};
