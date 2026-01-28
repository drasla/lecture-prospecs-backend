import { Request, Response, NextFunction } from "express";
import { reviewService } from "../services/review.service";
import { CreateReviewInput, UpdateReviewInput } from "../schemas/review.schema";
import { HttpException } from "../utils/exception.utils";

export const reviewController = {
    createReview: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const input = req.body as CreateReviewInput;

            const review = await reviewService.createReview(userId, input);
            res.status(201).json(review);
        } catch (error) {
            next(error);
        }
    },

    getProductReviews: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productId = Number(req.params.productId);
            if (isNaN(productId)) throw new HttpException(400, "Invalid Product ID");

            const reviews = await reviewService.getProductReviews(productId);
            res.status(200).json(reviews);
        } catch (error) {
            next(error);
        }
    },

    updateReview: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const reviewId = Number(req.params.id);
            if (isNaN(reviewId)) throw new HttpException(400, "Invalid Review ID");

            const input = req.body as UpdateReviewInput;

            const updatedReview = await reviewService.updateReview(userId, reviewId, input);
            res.status(200).json(updatedReview);
        } catch (error) {
            next(error);
        }
    },

    deleteReview: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const reviewId = Number(req.params.id);
            if (isNaN(reviewId)) throw new HttpException(400, "Invalid Review ID");

            await reviewService.deleteReview(userId, reviewId);
            res.status(200).json({ message: "리뷰가 삭제되었습니다." });
        } catch (error) {
            next(error);
        }
    },

    getMyReviews: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const reviews = await reviewService.getMyReviews(userId);
            res.status(200).json(reviews);
        } catch (error) {
            next(error);
        }
    },
};
