import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service";

export const cartController = {
    getCart: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id; // Passport 인증 미들웨어를 통과했다고 가정
            const cart = await cartService.getCart(userId);
            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }
    },

    addToCart: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { productSizeId, quantity } = req.body;
            const item = await cartService.addToCart(userId, productSizeId, quantity);
            res.status(201).json(item);
        } catch (error) {
            next(error);
        }
    },

    updateItem: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params; // cartItemId
            const { quantity } = req.body;
            const updated = await cartService.updateQuantity(Number(id), quantity);
            res.status(200).json(updated);
        } catch (error) {
            next(error);
        }
    },

    removeItem: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await cartService.removeItem(Number(id));
            res.status(200).json({ message: "Deleted" });
        } catch (error) {
            next(error);
        }
    },
};
