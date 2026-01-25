import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";
import { CategorySchema } from "./category.schema"; // 기존 스키마 재사용

extendZodWithOpenApi(z);

const ADMIN_TAG = "Admin/Category";

// ---------------------------------------------------------
// [Input] Request Schemas
// ---------------------------------------------------------

// 1. 카테고리 생성
export const CreateCategorySchema = z
    .object({
        name: z.string().min(1).openapi({ example: "러닝화" }),
        path: z.string().min(1).openapi({ example: "/shoes/running" }),
        parentId: z.number().int().optional().openapi({ example: 1 }),
    })
    .openapi("CreateCategoryRequest");

// 2. 카테고리 수정 (부모 이동 없이 이름/경로만 수정한다고 가정)
export const UpdateCategorySchema = z
    .object({
        name: z.string().min(1).openapi({ example: "러닝화(수정)" }),
        path: z.string().min(1).openapi({ example: "/shoes/running-edited" }),
    })
    .openapi("UpdateCategoryRequest");

// ---------------------------------------------------------
// [Registry] API Registration
// ---------------------------------------------------------

// 1. 카테고리 목록 조회 (관리자용)
registry.registerPath({
    method: "get",
    path: "/admin/categories",
    tags: [ADMIN_TAG],
    summary: "카테고리 목록 조회",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "성공",
            content: {
                "application/json": {
                    schema: z.array(CategorySchema),
                },
            },
        },
    },
});

// 2. 카테고리 생성
registry.registerPath({
    method: "post",
    path: "/admin/categories",
    tags: [ADMIN_TAG],
    summary: "카테고리 생성",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreateCategorySchema },
            },
        },
    },
    responses: {
        201: {
            description: "생성 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        category: CategorySchema,
                    }),
                },
            },
        },
        409: { description: "이미 존재하는 경로" },
        404: { description: "부모 카테고리 없음" },
    },
});

// 3. 카테고리 수정
registry.registerPath({
    method: "put",
    path: "/admin/categories/{id}",
    tags: [ADMIN_TAG],
    summary: "카테고리 수정",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                "application/json": { schema: UpdateCategorySchema },
            },
        },
    },
    responses: {
        200: {
            description: "수정 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        category: CategorySchema,
                    }),
                },
            },
        },
        404: { description: "카테고리 없음" },
        409: { description: "경로 중복" },
    },
});

// 4. 카테고리 삭제
registry.registerPath({
    method: "delete",
    path: "/admin/categories/{id}",
    tags: [ADMIN_TAG],
    summary: "카테고리 삭제",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: "삭제 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        404: { description: "카테고리 없음" },
    },
});

// Type Exports
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
