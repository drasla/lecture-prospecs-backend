import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";

extendZodWithOpenApi(z);

// ---------------------------------------------------------
// [Base Schema] 카테고리 기본 모델
// ---------------------------------------------------------
export const CategorySchema = z
    .object({
        id: z.number().openapi({ example: 1 }),
        name: z.string().openapi({ example: "신발" }),
        path: z.string().openapi({ example: "/shoes" }),
        parentId: z.number().nullable().openapi({ example: null }),
    })
    .openapi("Category");

// ---------------------------------------------------------
// [Response Schema] 상세 조회 (Breadcrumbs 포함)
// ---------------------------------------------------------
export const BreadcrumbSchema = z.object({
    id: z.number(),
    name: z.string(),
    path: z.string(),
});

export const CategoryDetailSchema = CategorySchema.extend({
    breadcrumbs: z.array(BreadcrumbSchema).openapi({
        description: "상위 카테고리 경로 (Root -> 현재)",
        example: [
            { id: 1, name: "여성", path: "/women" },
            { id: 5, name: "신발", path: "/women/shoes" },
        ],
    }),
}).openapi("CategoryDetailResponse");

// ---------------------------------------------------------
// [Registry] API 경로 등록
// ---------------------------------------------------------

// 1. 카테고리 목록 조회
registry.registerPath({
    method: "get",
    path: "/categories",
    tags: ["Category"],
    summary: "카테고리 목록 조회",
    description: "전체 카테고리 목록을 평문 리스트(Flat List)로 반환합니다.",
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: z.array(CategorySchema),
                },
            },
        },
    },
});

// 2. 카테고리 상세 조회
registry.registerPath({
    method: "get",
    path: "/categories/{id}",
    tags: ["Category"],
    summary: "카테고리 상세 조회",
    description: "특정 카테고리의 정보와 Breadcrumbs(경로)를 반환합니다.",
    request: {
        params: z.object({
            id: z.string().openapi({ example: "1", description: "카테고리 ID" }),
        }),
    },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: CategoryDetailSchema,
                },
            },
        },
        404: { description: "카테고리를 찾을 수 없음" },
    },
});
