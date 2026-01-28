import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";

extendZodWithOpenApi(z);

const REVIEW_TAG = "Review";

export const CreateReviewSchema = z
    .object({
        productId: z.number().int().positive().openapi({ example: 1 }),
        rating: z.number().int().min(1).max(5).openapi({ example: 5 }),
        content: z.string().min(5).openapi({ example: "신발이 정말 편하고 예뻐요!" }),
        imageUrls: z
            .array(z.url())
            .optional()
            .openapi({
                example: [
                    "https://cdn.myshop.com/review1.jpg",
                    "https://cdn.myshop.com/review2.jpg",
                ],
            }),
    })
    .openapi("CreateReviewRequest");

export const UpdateReviewSchema = z
    .object({
        rating: z.number().int().min(1).max(5).optional().openapi({ example: 4 }),
        content: z
            .string()
            .min(5)
            .optional()
            .openapi({ example: "생각보다 사이즈가 딱 맞네요! (수정됨)" }),
        imageUrls: z
            .array(z.url())
            .optional()
            .openapi({
                description:
                    "수정할 이미지 URL 목록 (기존 이미지는 삭제되고 이 목록으로 대체됩니다)",
                example: ["https://cdn.myshop.com/new-review.jpg"],
            }),
    })
    .openapi("UpdateReviewRequest");

const ReviewImageSchema = z.object({
    id: z.number(),
    url: z.string(),
});

export const ReviewResponseSchema = z
    .object({
        id: z.number(),
        rating: z.number(),
        content: z.string().nullable(),
        createdAt: z.iso.datetime(),
        user: z.object({
            name: z.string(),
        }),
        images: z.array(ReviewImageSchema), // 이미지 리스트 포함
    })
    .openapi("ReviewResponse");

export const MyReviewResponseSchema = z
    .object({
        id: z.number(),
        rating: z.number(),
        content: z.string().nullable(),
        createdAt: z.iso.datetime(),
        product: z.object({
            id: z.number(),
            name: z.string(),
            thumbnail: z.string().nullable(),
        }),
        images: z.array(
            z.object({
                id: z.number(),
                url: z.string(),
            }),
        ),
    })
    .openapi("MyReviewResponse");

registry.registerPath({
    method: "post",
    path: "/reviews",
    tags: [REVIEW_TAG],
    summary: "리뷰 작성",
    description: "상품에 대한 별점, 내용, 사진을 등록합니다.",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreateReviewSchema },
            },
        },
    },
    responses: {
        201: {
            description: "작성 성공",
            content: {
                "application/json": { schema: ReviewResponseSchema },
            },
        },
        400: { description: "잘못된 입력 (구매하지 않은 상품 등)" },
        404: { description: "상품 없음" },
    },
});

registry.registerPath({
    method: "put",
    path: "/reviews/{id}",
    tags: ["Review"],
    summary: "리뷰 수정",
    description: "작성자만 수정 가능합니다. 이미지는 입력된 목록으로 전체 교체됩니다.",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                "application/json": { schema: UpdateReviewSchema },
            },
        },
    },
    responses: {
        200: {
            description: "수정 성공",
            content: {
                "application/json": { schema: ReviewResponseSchema }, // 기존 응답 스키마 재사용
            },
        },
        403: { description: "권한 없음 (작성자 아님)" },
        404: { description: "리뷰 없음" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/reviews/{id}",
    tags: ["Review"],
    summary: "리뷰 삭제",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: "삭제 성공",
            content: {
                "application/json": {
                    schema: z.object({ message: z.string() }),
                },
            },
        },
        403: { description: "권한 없음" },
        404: { description: "리뷰 없음" },
    },
});

registry.registerPath({
    method: "get",
    path: "/products/{productId}/reviews",
    tags: [REVIEW_TAG],
    summary: "상품 리뷰 목록 조회",
    request: {
        params: z.object({ productId: z.string() }),
    },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: z.array(ReviewResponseSchema),
                },
            },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/reviews/me",
    tags: [REVIEW_TAG],
    summary: "내 리뷰 목록 조회",
    description: "내가 작성한 리뷰 목록을 상품 정보와 함께 조회합니다.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: z.array(MyReviewResponseSchema),
                },
            },
        },
    },
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
