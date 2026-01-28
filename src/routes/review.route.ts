import { Router } from "express";
import { reviewController } from "../controllers/review.controller";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { CreateReviewSchema, UpdateReviewSchema } from "../schemas/review.schema";
import { validateBody } from "../middlewares/validation.middleware";

const router = Router();

router.post(
    "/reviews",
    authenticateJwt,
    validateBody(CreateReviewSchema),
    reviewController.createReview,
);
router.get("/products/:productId/reviews", reviewController.getProductReviews);
router.get("/reviews/me", authenticateJwt, reviewController.getMyReviews);
router.put(
    "/reviews/:id",
    authenticateJwt,
    validateBody(UpdateReviewSchema),
    reviewController.updateReview,
);
router.delete("/reviews/:id", authenticateJwt, reviewController.deleteReview);

export default router;
