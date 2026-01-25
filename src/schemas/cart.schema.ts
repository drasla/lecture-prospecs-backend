import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";

extendZodWithOpenApi(z);

const CART_TAG = "Cart";

// ---------------------------------------------------------
// [Input] Request Schemas
// ---------------------------------------------------------

// 1. 장바구니 담기
export const AddToCartSchema = z
    .object({
        productSizeId: z.number().int().positive().openapi({ example: 10 }),
        quantity: z.number().int().min(1).openapi({ example: 1 }),
    })
    .openapi("AddToCartRequest");

// 2. 수량 변경
export const UpdateCartItemSchema = z
    .object({
        quantity: z.number().int().min(1).openapi({ example: 2 }),
    })
    .openapi("UpdateCartItemRequest");

// ---------------------------------------------------------
// [Output] Response Schemas (Nested Structure)
// ---------------------------------------------------------

// (1) 상품 정보 (최소한의 정보)
const ProductSimpleSchema = z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    // 필요한 경우 썸네일 이미지 등 추가
});

// (2) 색상 정보 (+ 이미지)
const ColorSimpleSchema = z.object({
    colorName: z.string(),
    hexCode: z.string().nullable(),
    product: ProductSimpleSchema,
    images: z.array(z.object({ url: z.string() })),
});

// (3) 사이즈 정보
const SizeSimpleSchema = z.object({
    id: z.number(),
    size: z.string(),
    stock: z.number(),
    productColor: ColorSimpleSchema,
});

// (4) 장바구니 아이템
const CartItemSchema = z.object({
    id: z.number().openapi({ description: "CartItem ID" }),
    quantity: z.number(),
    productSizeId: z.number(),
    productSize: SizeSimpleSchema, // 위에서 정의한 중첩 구조 연결
});

// (5) 장바구니 전체
export const CartResponseSchema = z
    .object({
        id: z.number(),
        userId: z.number(),
        items: z.array(CartItemSchema),
    })
    .openapi("CartResponse");

// ---------------------------------------------------------
// [Registry] API Registration
// ---------------------------------------------------------

// 1. 장바구니 조회
registry.registerPath({
    method: "get",
    path: "/cart",
    tags: [CART_TAG],
    summary: "내 장바구니 조회",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "성공",
            content: {
                "application/json": {
                    schema: CartResponseSchema,
                },
            },
        },
    },
});

// 2. 장바구니 담기
registry.registerPath({
    method: "post",
    path: "/cart",
    tags: [CART_TAG],
    summary: "장바구니에 상품 담기",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: AddToCartSchema },
            },
        },
    },
    responses: {
        201: {
            description: "담기 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        item: CartItemSchema.partial(), // 일부 필드만 리턴될 수 있으므로 partial
                    }),
                },
            },
        },
        404: { description: "존재하지 않는 상품 옵션(Size ID)" },
    },
});

// 3. 수량 변경
registry.registerPath({
    method: "put",
    path: "/cart/{id}",
    tags: [CART_TAG],
    summary: "장바구니 아이템 수량 변경",
    description: "ID는 ProductId가 아니라 **CartItemId**입니다.",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                "application/json": { schema: UpdateCartItemSchema },
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
                        updated: z.object({ quantity: z.number() }),
                    }),
                },
            },
        },
        404: { description: "아이템 없음" },
    },
});

// 4. 삭제
registry.registerPath({
    method: "delete",
    path: "/cart/{id}",
    tags: [CART_TAG],
    summary: "장바구니 아이템 삭제",
    description: "ID는 **CartItemId**입니다.",
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
        404: { description: "아이템 없음" },
    },
});

// Types
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
