import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";
import z from "zod";
import {
    CreateProductSchema,
    ProductDetailSchema,
    ProductListQuerySchema,
    ProductSchema,
} from "./product.schema";

extendZodWithOpenApi(z);

const ADMIN_TAG = "Admin/Product";

// 1. [Admin] 상품 생성
registry.registerPath({
    method: "post",
    path: "/admin/products",
    tags: [ADMIN_TAG],
    summary: "상품 등록",
    security: [{ bearerAuth: [] }], // 관리자 토큰 필요
    request: {
        body: {
            content: {
                "application/json": {
                    schema: CreateProductSchema, // 위에서 만든 생성용 스키마 재사용
                },
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
                        product: ProductSchema, // 생성된 상품 정보 반환
                    }),
                },
            },
        },
        409: { description: "상품 코드 중복" },
    },
});

// 2. [Admin] 상품 목록 조회 (Admin용은 Public과 로직이 같지만 경로는 다름)
registry.registerPath({
    method: "get",
    path: "/admin/products",
    tags: [ADMIN_TAG],
    summary: "상품 목록 조회 (관리자용)",
    security: [{ bearerAuth: [] }],
    request: {
        query: ProductListQuerySchema, // 필터링 스키마 재사용
    },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        meta: z.object({
                            total: z.number(),
                            page: z.number(),
                            lastPage: z.number(),
                        }),
                        data: z.array(ProductSchema),
                    }),
                },
            },
        },
    },
});

// 3. [Admin] 상품 상세 조회
registry.registerPath({
    method: "get",
    path: "/admin/products/{id}",
    tags: [ADMIN_TAG],
    summary: "상품 상세 조회 (관리자용)",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: ProductDetailSchema, // 상세 스키마(이미지/색상 포함) 재사용
                },
            },
        },
        404: { description: "상품 없음" },
    },
});

// 4. [Admin] 상품 수정
registry.registerPath({
    method: "put",
    path: "/admin/products/{id}",
    tags: [ADMIN_TAG],
    summary: "상품 수정",
    description: "상품 정보를 전체 수정합니다. (기존 옵션 삭제 후 재생성)",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                "application/json": {
                    schema: CreateProductSchema, // 생성과 동일한 입력 구조
                },
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
                        product: ProductSchema,
                    }),
                },
            },
        },
        404: { description: "상품 없음" },
        409: { description: "주문 내역이 있어 수정 불가" },
    },
});

// 5. [Admin] 상품 삭제
registry.registerPath({
    method: "delete",
    path: "/admin/products/{id}",
    tags: [ADMIN_TAG],
    summary: "상품 삭제",
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
        409: { description: "주문 내역이 있어 삭제 불가" },
    },
});
