import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";

extendZodWithOpenApi(z);

const INQUIRY_TAG = "Inquiry";
const ADMIN_INQUIRY_TAG = "Admin/Inquiry";

// ---------------------------------------------------------
// [Enums] Prisma Enum과 일치
// ---------------------------------------------------------
export const InquiryTypeEnum = z.enum([
    "DELIVERY",
    "PRODUCT",
    "EXCHANGE_RETURN",
    "MEMBER",
    "OTHER",
]);

export const InquiryStatusEnum = z.enum(["PENDING", "ANSWERED"]);

// ---------------------------------------------------------
// [Base Schemas] Response용 기본 구조
// ---------------------------------------------------------
const InquiryImageSchema = z.object({
    id: z.number(),
    url: z.string(),
});

const UserSimpleSchema = z.object({
    name: z.string(),
    email: z.string(),
});

export const InquiryResponseSchema = z
    .object({
        id: z.number(),
        type: InquiryTypeEnum,
        title: z.string(),
        content: z.string(),
        status: InquiryStatusEnum,
        answer: z.string().nullable(),
        answeredAt: z.date().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
        images: z.array(InquiryImageSchema).optional(),
        user: UserSimpleSchema.optional(), // 관리자 조회 시 필요
    })
    .openapi("InquiryResponse");

// ---------------------------------------------------------
// [Input] Request Schemas
// ---------------------------------------------------------

// 1. 문의 등록 (사용자)
export const CreateInquirySchema = z
    .object({
        type: InquiryTypeEnum.openapi({ example: "PRODUCT" }),
        title: z.string().min(1).openapi({ example: "상품 사이즈 문의합니다." }),
        content: z.string().min(1).openapi({ example: "270 사이즈 재고 언제 들어오나요?" }),
        images: z
            .array(z.url())
            .optional()
            .openapi({
                example: ["https://example.com/image1.jpg"],
            }),
    })
    .openapi("CreateInquiryRequest");

// 2. 답변 등록 (관리자)
export const AnswerInquirySchema = z
    .object({
        answer: z.string().min(1).openapi({ example: "재고는 다음주 화요일 입고 예정입니다." }),
    })
    .openapi("AnswerInquiryRequest");

// ---------------------------------------------------------
// [Registry] API Registration
// ---------------------------------------------------------

// 1. 문의 등록
registry.registerPath({
    method: "post",
    path: "/inquiries",
    tags: [INQUIRY_TAG],
    summary: "1:1 문의 등록",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreateInquirySchema },
            },
        },
    },
    responses: {
        201: {
            description: "등록 성공",
            content: { "application/json": { schema: InquiryResponseSchema } },
        },
    },
});

// 2. 내 문의 목록 조회
registry.registerPath({
    method: "get",
    path: "/inquiries/me",
    tags: [INQUIRY_TAG],
    summary: "내 문의 내역 조회",
    security: [{ bearerAuth: [] }],
    parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
    ],
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        data: z.array(InquiryResponseSchema),
                        meta: z.object({
                            total: z.number(),
                            page: z.number(),
                            lastPage: z.number(),
                        }),
                    }),
                },
            },
        },
    },
});

// 3. 문의 상세 조회 (공통)
registry.registerPath({
    method: "get",
    path: "/inquiries/{id}",
    tags: [INQUIRY_TAG],
    summary: "문의 상세 조회",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
    },
    responses: {
        200: {
            description: "성공",
            content: { "application/json": { schema: InquiryResponseSchema } },
        },
        403: { description: "권한 없음" },
        404: { description: "찾을 수 없음" },
    },
});

// 4. 전체 문의 조회 (관리자)
registry.registerPath({
    method: "get",
    path: "/admin/inquiries",
    tags: [ADMIN_INQUIRY_TAG],
    summary: "전체 문의 조회 (관리자)",
    security: [{ bearerAuth: [] }],
    parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        { name: "status", in: "query", schema: { type: "string" }, required: false }, // PENDING, ANSWERED
    ],
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        data: z.array(InquiryResponseSchema),
                        meta: z.object({
                            total: z.number(),
                            page: z.number(),
                            lastPage: z.number(),
                        }),
                    }),
                },
            },
        },
    },
});

// 5. 답변 등록 (관리자)
registry.registerPath({
    method: "put",
    path: "/admin/inquiries/{id}/answer",
    tags: [ADMIN_INQUIRY_TAG],
    summary: "문의 답변 등록/수정",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.string() }),
        body: {
            content: {
                "application/json": { schema: AnswerInquirySchema },
            },
        },
    },
    responses: {
        200: {
            description: "답변 등록 성공",
            content: { "application/json": { schema: InquiryResponseSchema } },
        },
    },
});

export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;
export type AnswerInquiryInput = z.infer<typeof AnswerInquirySchema>;
