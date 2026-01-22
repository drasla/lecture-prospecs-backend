import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";

export const orderController = {
    // 주문 생성
    createOrder: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const {
                items,
                recipientName,
                recipientPhone,
                zipCode,
                address1,
                address2,
                gatePassword,
                deliveryRequest,
                paymentMethod,
            } = req.body;

            if (!items || items.length === 0) {
                throw new Error("NO_ITEMS_TO_ORDER");
            }

            const order = await orderService.createOrder({
                userId,
                items,
                recipientName,
                recipientPhone,
                zipCode,
                address1,
                address2,
                gatePassword,
                deliveryRequest,
                paymentMethod,
            });

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
            const order = await orderService.getOrderDetail(userId, orderId);
            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },

    // 결제 승인 요청
    confirmOrder: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 프론트엔드 successUrl에서 쿼리 파라미터로 받은 값들
            const { paymentKey, orderId, amount } = req.body;

            const order = await orderService.confirmOrder(paymentKey, orderId, Number(amount));

            res.status(200).json(order);
        } catch (error) {
            next(error);
        }
    },
};
