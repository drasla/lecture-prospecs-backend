// src/schemas/product.schema.ts
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ProductStyle, ProductGender } from "@prisma/client"; // Prisma Enum
import { registry } from "../config/openApi";

extendZodWithOpenApi(z);

export const ProductStyleEnum = z.enum(ProductStyle).openapi({
    description: "상품 종류 (RACING, JACKET, etc.)",
    example: ProductStyle.RACING,
});

export const ProductGenderEnum = z.enum(ProductGender).openapi({
    description: "상품 성별 (MALE, FEMALE, COMMON)",
    example: ProductGender.COMMON,
});

// ---------------------------------------------------------
// 2. Sub-Schemas (Image, Size, Color)
// ---------------------------------------------------------

// 이미지
export const ProductImageSchema = z.object({
    id: z.number(),
    url: z.url(),
});

// 사이즈 (재고 포함)
export const ProductSizeSchema = z.object({
    id: z.number(),
    size: z.string().openapi({ example: "270" }),
    stock: z.number().int().min(0).openapi({ example: 100 }),
});

// 색상 (이미지와 사이즈를 포함)
export const ProductColorSchema = z.object({
    id: z.number(),
    productCode: z.string().openapi({ example: "PRD-001-BK" }),
    colorName: z.string().openapi({ example: "Black" }),
    hexCode: z.string().nullable().openapi({ example: "#000000" }),
    colorInfo: z.string().nullable(),
    images: z.array(ProductImageSchema),
    sizes: z.array(ProductSizeSchema),
});

// ---------------------------------------------------------
// 3. Main Product Schema
// ---------------------------------------------------------

export const ProductSchema = z
    .object({
        id: z.number(),
        createdAt: z.iso.datetime(),
        name: z.string().openapi({ example: "프로스펙스 러닝화" }),
        description: z.string().openapi({ example: "편안한 러닝화입니다." }),
        summary: z.string().optional().openapi({ example: "요약 설명" }),
        price: z.number().int(),

        isNew: z.boolean().default(false),
        isBest: z.boolean().default(false),

        style: ProductStyleEnum,
        gender: ProductGenderEnum,

        categoryId: z.number().int().positive(),

        material: z.string().optional(),
        sizeInfo: z.string().optional(),
        manufacturer: z.string().optional(),
        originCountry: z.string().optional(),
        careInstructions: z.string().optional(),
        manufactureDate: z.string().optional(),
        qualityAssurance: z.string().optional(),
        asPhone: z.string().optional(),

        colors: z.array(ProductColorSchema),
    })
    .openapi("Product");

export const CreateProductSchema = z
    .object({
        name: z.string().min(1).openapi({ example: "러닝화" }),
        description: z.string().openapi({ example: "편안한 러닝화입니다." }),
        summary: z.string().optional().openapi({ example: "요약 설명" }),
        price: z.number().min(0).openapi({ example: 129000 }),
        categoryId: z.number().int().positive(),

        style: ProductStyleEnum.openapi({ example: "RACING" }),
        gender: ProductGenderEnum.openapi({ example: "COMMON" }),

        material: z.string().optional(),
        sizeInfo: z.string().optional(),
        manufacturer: z.string().optional(),
        originCountry: z.string().optional(),
        careInstructions: z.string().optional(),
        manufactureDate: z.string().optional(),
        qualityAssurance: z.string().optional(),
        asPhone: z.string().optional(),

        isNew: z.boolean().default(false),
        isBest: z.boolean().default(false),

        colors: z
            .array(
                z.object({
                    productCode: z.string().min(1).openapi({ example: "PRD-BK-001" }),
                    colorName: z.string().min(1).openapi({ example: "Black" }),
                    hexCode: z.string().optional().openapi({ example: "#000000" }),
                    colorInfo: z.string().optional(),
                    images: z
                        .array(z.url())
                        .min(1)
                        .openapi({ example: ["https://image.url/1.jpg"] }),
                    sizes: z
                        .array(
                            z.object({
                                size: z.string().min(1).openapi({ example: "270" }),
                                stock: z.number().int().min(0).openapi({ example: 100 }),
                            }),
                        )
                        .min(1),
                }),
            )
            .min(1),
    })
    .openapi("CreateProductRequest");

// 상세 조회용 스키마 (색상/사이즈/이미지 포함)
export const ProductDetailSchema = ProductSchema.extend({
    category: z.object({
        id: z.number(),
        name: z.string(),
    }),
    colors: z.array(ProductColorSchema),
}).openapi("ProductDetailResponse");

const toArray = (val: unknown) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val; // 이미 배열이면 통과
    return [val]; // 문자열이면 배열로 감쌈
};

export const ProductListQuerySchema = z.object({
    page: z.preprocess(val => Number(val) || 1, z.number().min(1).default(1)),
    limit: z.preprocess(val => Number(val) || 40, z.number().min(1).max(100).default(40)),
    categoryId: z.preprocess(val => (val ? Number(val) : undefined), z.number().optional()),

    // ?styles=RACING&styles=JACKET 형태로 들어오는 것을 배열로 변환
    styles: z.preprocess(toArray, z.array(ProductStyleEnum).optional()),
    genders: z.preprocess(toArray, z.array(ProductGenderEnum).optional()),
    sizes: z.preprocess(toArray, z.array(z.string()).optional()),
});

// ---------------------------------------------------------
// 4. Registry Registration
// ---------------------------------------------------------

// GET /products (Query 파라미터 적용)
registry.registerPath({
    method: "get",
    path: "/products",
    tags: ["Product"],
    summary: "상품 목록 조회",
    request: {
        query: ProductListQuerySchema, // 여기서 정의한 스키마 사용
    },
    responses: {
        200: {
            description: "성공",
            content: {
                "application/json": {
                    // 실제 Response Schema는 이전 턴에서 만든 ProductSchema 배열 사용
                    schema: z.object({
                        meta: z.object({
                            total: z.number(),
                            page: z.number(),
                            lastPage: z.number(),
                        }),
                        data: z.array(z.any()), // 순환참조 방지 등을 위해 any 혹은 ProductSchema
                    }),
                },
            },
        },
    },
});

// Type Exports
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

// 상품 상세 조회
registry.registerPath({
    method: "get",
    path: "/products/{id}",
    tags: ["Product"],
    summary: "상품 상세 조회",
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: "성공",
            content: {
                "application/json": {
                    schema: ProductDetailSchema, // Colors, Sizes, Images 포함
                },
            },
        },
        404: { description: "상품 없음" },
    },
});
