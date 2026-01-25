import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";
import { Gender, Role } from "@prisma/client"; // 작성하신 config 파일

extendZodWithOpenApi(z); // Zod에 OpenAPI 기능 확장

// [Enum] 성별
export const GenderEnum = z.enum(Gender).openapi({
    description: "성별 (MALE, FEMALE)",
    example: Gender.MALE,
});

export const RoleEnum = z.enum(Role).openapi({
    description: "Role (USER, ADMIN)",
    example: Role.USER,
});

// 1. 회원가입 Request Schema
export const RegisterSchema = z
    .object({
        email: z.email().openapi({ example: "user@example.com" }),
        emailOptIn: z.boolean().default(false).openapi({ description: "이메일 수신동의" }),
        password: z.string().min(6).openapi({ example: "password123" }),
        passwordConfirm: z.string().min(6).openapi({ example: "password123" }),
        name: z.string().min(2).openapi({ example: "홍길동" }),
        phone: z.string().openapi({ example: "010-1234-5678" }),
        smsOptIn: z.boolean().default(false).openapi({ description: "SMS 수신동의" }),
        birthdate: z.iso.date().openapi({ example: "1990-01-01" }),
        gender: GenderEnum,
        zipCode: z.string().optional().openapi({ example: "12345" }),
        address1: z.string().optional().openapi({ example: "서울시 강남구" }),
        address2: z.string().optional().openapi({ example: "101호" }),
    })
    .openapi("RegisterRequest"); // Component 이름

// 2. 로그인 Request Schema
export const LoginSchema = z
    .object({
        email: z.email().openapi({ example: "user@example.com" }),
        password: z.string().openapi({ example: "password123" }),
    })
    .openapi("LoginRequest");

// 3. User Response Schema (공통)
const UserResponseSchema = z
    .object({
        id: z.number(),
        createdAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00.000Z" }),
        email: z.string(),
        name: z.string(),
        role: RoleEnum,
        phone: z.string(),
        birthdate: z.string(),
        zipCode: z.string().nullable(),
        address1: z.string().nullable(),
        address2: z.string().nullable(),
        emailOptIn: z.boolean(),
        smsOptIn: z.boolean(),
    })
    .openapi("UserResponse");

// 4. 로그인 성공 응답
const LoginResponseSchema = z.object({
    message: z.string(),
    token: z.string(),
    user: UserResponseSchema,
});

// --- API 경로 등록 (Route Definition) ---

// POST /auth/register
registry.registerPath({
    method: "post",
    path: "/auth/register",
    tags: ["Auth"],
    summary: "회원가입",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: RegisterSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "회원가입 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        user: UserResponseSchema,
                    }),
                },
            },
        },
        409: { description: "이미 존재하는 이메일" },
        400: { description: "비밀번호 불일치 등 입력 오류" },
    },
});

// POST /auth/login
registry.registerPath({
    method: "post",
    path: "/auth/login",
    tags: ["Auth"],
    summary: "로그인",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: LoginSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "로그인 성공",
            content: {
                "application/json": {
                    schema: LoginResponseSchema,
                },
            },
        },
        401: { description: "인증 실패 (비밀번호 오류 등)" },
    },
});

// GET /auth/me
registry.registerPath({
    method: "get",
    path: "/auth/me",
    tags: ["Auth"],
    summary: "내 정보 조회",
    security: [{ bearerAuth: [] }], // 로그인 필요
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: UserResponseSchema,
                },
            },
        },
        401: { description: "인증 실패 (토큰 없음)" },
    },
});

// TypeScript 타입 추출 (Service 등에서 사용하기 위해)
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
