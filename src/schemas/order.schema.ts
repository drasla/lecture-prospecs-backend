import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";
import { OrderStatus } from "@prisma/client";

extendZodWithOpenApi(z);

const ORDER_TAG = "Order";

// ---------------------------------------------------------
// [Input] Request Schemas
// ---------------------------------------------------------

// 1. 주문 상품 아이템
const OrderItemInputSchema = z.object({
    productSizeId: z.number().int().positive().openapi({ example: 10 }),
    quantity: z.number().int().min(1).openapi({ example: 1 }),
});

// 2. 주문 생성 요청
export const CreateOrderSchema = z
    .object({
        items: z.array(OrderItemInputSchema).min(1).openapi({ description: "주문할 상품 목록" }),

        // 배송지 정보
        recipientName: z.string().min(1).openapi({ example: "홍길동" }),
        recipientPhone: z.string().min(10).openapi({ example: "010-1234-5678" }),
        zipCode: z.string().min(5).openapi({ example: "12345" }),
        address1: z.string().min(1).openapi({ example: "서울시 강남구" }),
        address2: z.string().min(1).openapi({ example: "101호" }),
        gatePassword: z.string().optional().openapi({ example: "#1234" }),
        deliveryRequest: z.string().optional().openapi({ example: "문 앞에 놔주세요" }),

        paymentMethod: z.string().min(1).openapi({ example: "TOSS_PAYMENTS" }),
    })
    .openapi("CreateOrderRequest");

// 3. 결제 승인 요청 (프론트 -> 백엔드)
export const ConfirmOrderSchema = z
    .object({
        paymentKey: z.string().min(1).openapi({ example: "tgen_2024..." }),
        orderId: z.string().min(1).openapi({ example: "uuid-order-number" }),
        amount: z.number().int().positive().openapi({ example: 55000 }),
    })
    .openapi("ConfirmOrderRequest");

// 4. 주문 취소 요청
export const CancelOrderSchema = z
    .object({
        reason: z.string().min(1).openapi({ example: "단순 변심" }),
    })
    .openapi("CancelOrderRequest");

// ---------------------------------------------------------
// [Output] Response Schemas
// ---------------------------------------------------------

// 상품 요약 정보 (응답용)
const ProductSnapshotSchema = z.object({
    name: z.string(),
    price: z.number(),
    // 필요한 경우 이미지 등 추가
});

// 주문 아이템 응답
const OrderItemResponseSchema = z.object({
    id: z.number(),
    quantity: z.number(),
    price: z.number(),
    // 중첩된 상품 정보 구조화
    productSize: z.object({
        size: z.string(),
        productColor: z.object({
            colorName: z.string(),
            product: ProductSnapshotSchema,
            images: z.array(z.object({ url: z.string() })).optional(),
        }),
    }),
});

// 결제 정보 응답
const PaymentResponseSchema = z.object({
    status: z.string(),
    method: z.string(),
    amount: z.number(),
});

// 주문 전체 응답
export const OrderResponseSchema = z
    .object({
        id: z.number(),
        orderNumber: z.string(),
        status: z.enum(OrderStatus).openapi({ example: "PAID" }),
        totalAmount: z.number(),
        createdAt: z.iso.datetime(),

        recipientName: z.string(),
        address1: z.string(),

        items: z.array(OrderItemResponseSchema),
        payment: PaymentResponseSchema.nullable().optional(),
    })
    .openapi("OrderResponse");

// ---------------------------------------------------------
// [Registry] API Registration
// ---------------------------------------------------------

// 1. 주문 생성
registry.registerPath({
    method: "post",
    path: "/orders",
    tags: [ORDER_TAG],
    summary: "주문 생성",
    description: "주문 정보를 생성하고 결제 대기 상태(PENDING)로 만듭니다.",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreateOrderSchema },
            },
        },
    },
    responses: {
        201: {
            description: "주문 생성 성공",
            content: {
                "application/json": { schema: OrderResponseSchema },
            },
        },
        404: { description: "상품 정보 없음" },
        409: { description: "재고 부족" },
    },
});

// 2. 주문 목록 조회
registry.registerPath({
    method: "get",
    path: "/orders",
    tags: [ORDER_TAG],
    summary: "내 주문 목록 조회",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: z.array(OrderResponseSchema),
                },
            },
        },
    },
});

// 3. 주문 상세 조회
registry.registerPath({
    method: "get",
    path: "/orders/{id}",
    tags: [ORDER_TAG],
    summary: "주문 상세 조회",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": { schema: OrderResponseSchema },
            },
        },
        404: { description: "주문 없음" },
        403: { description: "권한 없음" },
    },
});

// 4. 결제 승인
registry.registerPath({
    method: "post",
    path: "/orders/confirm",
    tags: [ORDER_TAG],
    summary: "결제 승인 (토스페이먼츠)",
    description: "클라이언트 결제 성공 후 서버에서 최종 승인 처리를 합니다.",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: ConfirmOrderSchema },
            },
        },
    },
    responses: {
        200: {
            description: "결제 및 주문 완료",
            content: {
                "application/json": { schema: OrderResponseSchema },
            },
        },
        400: { description: "금액 불일치 또는 결제 실패" },
    },
});

// 5. 주문 취소
registry.registerPath({
    method: "post",
    path: "/orders/{id}/cancel",
    tags: ["Order"],
    summary: "주문 취소",
    description: "배송 시작 전(PENDING, PAID) 상태일 때만 취소 가능하며, 결제된 경우 환불 처리와 함께 재고가 복구됩니다.",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                "application/json": { schema: CancelOrderSchema },
            },
        },
    },
    responses: {
        200: {
            description: "취소 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        orderId: z.number(),
                        status: z.string(),
                    }),
                },
            },
        },
        400: { description: "이미 배송된 상품이거나 취소 불가 상태" },
        403: { description: "권한 없음" },
    },
});

// Types
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof ConfirmOrderSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
