import { prisma } from "../config/prisma";
import { CreateReviewInput, UpdateReviewInput } from "../schemas/review.schema";
import { HttpException } from "../utils/exception.utils";
import { OrderStatus } from "@prisma/client";

export const reviewService = {
    async createReview(userId: number, data: CreateReviewInput) {
        const { productId, rating, content, imageUrls } = data;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new HttpException(404, "존재하지 않는 상품입니다.");

        const hasPurchased = await prisma.orderItem.findFirst({
            where: {
                order: {
                    userId: userId,
                    status: { in: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED] },
                },
                productSize: {
                    productColor: { productId: productId },
                },
            },
        });

        if (!hasPurchased) {
            throw new HttpException(
                403,
                "상품을 구매하고 배송이 완료된 회원만 리뷰를 작성할 수 있습니다.",
            );
        }

        const existingReview = await prisma.review.findFirst({
            where: { userId, productId },
        });
        if (existingReview) {
            throw new HttpException(409, "이미 이 상품에 대한 리뷰를 작성하셨습니다.");
        }

        return await prisma.review.create({
            data: {
                userId,
                productId,
                rating,
                content,
                images:
                    imageUrls && imageUrls.length > 0
                        ? {
                              create: imageUrls.map(url => ({ url })),
                          }
                        : undefined,
            },
            include: {
                user: { select: { name: true } },
                images: true,
            },
        });
    },

    async getProductReviews(productId: number) {
        return prisma.review.findMany({
            where: { productId },
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true } },
                images: true,
            },
        });
    },

    async updateReview(userId: number, reviewId: number, data: UpdateReviewInput) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });

        if (!review) throw new HttpException(404, "리뷰를 찾을 수 없습니다.");
        if (review.userId !== userId) throw new HttpException(403, "리뷰 수정 권한이 없습니다.");

        return prisma.review.update({
            where: { id: reviewId },
            data: {
                rating: data.rating,
                content: data.content,
                images: data.imageUrls
                    ? {
                          deleteMany: {},
                          create: data.imageUrls.map(url => ({ url })),
                      }
                    : undefined,
            },
            include: {
                user: { select: { name: true } },
                images: true,
            },
        });
    },

    async deleteReview(userId: number, reviewId: number) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });

        if (!review) throw new HttpException(404, "리뷰를 찾을 수 없습니다.");
        if (review.userId !== userId) throw new HttpException(403, "리뷰 삭제 권한이 없습니다.");

        return prisma.review.delete({
            where: { id: reviewId },
        });
    },

    async getMyReviews(userId: number) {
        const reviews = await prisma.review.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                images: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        colors: {
                            take: 1,
                            include: {
                                images: {
                                    take: 1,
                                    select: { url: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        return reviews.map(review => {
            const productThumb = review.product.colors[0]?.images[0]?.url || null;

            return {
                id: review.id,
                rating: review.rating,
                content: review.content,
                createdAt: review.createdAt,
                images: review.images,
                product: {
                    id: review.product.id,
                    name: review.product.name,
                    thumbnail: productThumb,
                },
            };
        });
    },
};
