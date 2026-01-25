import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service";
import { AddToCartInput, UpdateCartItemInput } from "../schemas/cart.schema";
import { HttpException } from "../utils/exception.utils";

export const cartController = {
    // 조회
    getCart: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const cart = await cartService.getCart(userId);
            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }
    },

    // 담기
    addToCart: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { productSizeId, quantity } = req.body as AddToCartInput;

            const item = await cartService.addToCart(userId, productSizeId, quantity);
            res.status(201).json({ message: "장바구니에 담았습니다.", item });
        } catch (error) {
            next(error);
        }
    },

    // 수량 변경
    updateItem: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const cartItemId = Number(req.params.id);
            if (isNaN(cartItemId)) throw new HttpException(400, "Invalid ID");

            const { quantity } = req.body as UpdateCartItemInput;

            const updated = await cartService.updateQuantity(userId, cartItemId, quantity);
            res.status(200).json({ message: "수량이 변경되었습니다.", updated });
        } catch (error) {
            next(error);
        }
    },

    // 삭제
    removeItem: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const cartItemId = Number(req.params.id);
            if (isNaN(cartItemId)) throw new HttpException(400, "Invalid ID");

            await cartService.removeItem(userId, cartItemId);
            res.status(200).json({ message: "삭제되었습니다." });
        } catch (error) {
            next(error);
        }
    },
};
