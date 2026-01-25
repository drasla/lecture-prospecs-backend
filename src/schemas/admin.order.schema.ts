import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";
import { OrderStatus } from "@prisma/client";
import { OrderResponseSchema } from "./order.schema"; // 기존 응답 스키마 재사용

extendZodWithOpenApi(z);

const ADMIN_TAG = "Admin/Order";

// ---------------------------------------------------------
// [Input] Request Schemas
// ---------------------------------------------------------

// 1. 주문 목록 조회 필터
export const AdminOrderListQuerySchema = z.object({
    page: z.preprocess(val => Number(val) || 1, z.number().min(1).default(1)),
    limit: z.preprocess(val => Number(val) || 20, z.number().min(1).max(100).default(20)),
    status: z.enum(OrderStatus).optional().openapi({ description: "주문 상태 필터" }),
    search: z.string().optional().openapi({ description: "주문번호 또는 수령인 이름 검색" }),
});

// 2. 주문 상태 변경 (예: 배송중 처리)
export const UpdateOrderStatusSchema = z.object({
    status: z.enum(OrderStatus).openapi({ example: "SHIPPED" }),
});

// 3. 운송장 번호 입력
export const UpdateTrackingSchema = z
    .object({
        carrier: z.string().min(1).openapi({ example: "CJ대한통운" }),
        trackingNumber: z.string().min(1).openapi({ example: "654123987123" }),
    })
    .openapi("UpdateTrackingRequest");

// ---------------------------------------------------------
// [Registry] API Registration
// ---------------------------------------------------------

// 1. 전체 주문 목록 조회
registry.registerPath({
    method: "get",
    path: "/admin/orders",
    tags: [ADMIN_TAG],
    summary: "전체 주문 목록 조회",
    security: [{ bearerAuth: [] }],
    request: {
        query: AdminOrderListQuerySchema,
    },
    responses: {
        200: {
            description: "성공",
            content: {
                "application/json": {
                    schema: z.object({
                        meta: z.object({
                            total: z.number(),
                            page: z.number(),
                            lastPage: z.number(),
                        }),
                        data: z.array(OrderResponseSchema), // 기존 OrderResponseSchema 재사용
                    }),
                },
            },
        },
    },
});

// 2. 주문 상세 조회
registry.registerPath({
    method: "get",
    path: "/admin/orders/{id}",
    tags: [ADMIN_TAG],
    summary: "주문 상세 조회",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: "성공",
            content: {
                "application/json": { schema: OrderResponseSchema },
            },
        },
        404: { description: "주문 없음" },
    },
});

// 3. 주문 상태 변경
registry.registerPath({
    method: "patch",
    path: "/admin/orders/{id}/status",
    tags: [ADMIN_TAG],
    summary: "주문 상태 변경",
    description: "주문 상태를 강제로 변경합니다 (예: 입금확인, 배송완료 등).",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                "application/json": { schema: UpdateOrderStatusSchema },
            },
        },
    },
    responses: {
        200: {
            description: "상태 변경 성공",
            content: {
                "application/json": { schema: OrderResponseSchema },
            },
        },
    },
});

// 4. 운송장 입력 및 배송 시작
registry.registerPath({
    method: "patch",
    path: "/admin/orders/{id}/tracking",
    tags: [ADMIN_TAG],
    summary: "운송장 입력 (배송 시작)",
    description: "운송장 번호를 입력하면 주문 상태가 자동으로 SHIPPED로 변경됩니다.",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                "application/json": { schema: UpdateTrackingSchema },
            },
        },
    },
    responses: {
        200: {
            description: "입력 성공",
            content: {
                "application/json": { schema: OrderResponseSchema },
            },
        },
    },
});

// Types
export type AdminOrderListQuery = z.infer<typeof AdminOrderListQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateTrackingInput = z.infer<typeof UpdateTrackingSchema>;
