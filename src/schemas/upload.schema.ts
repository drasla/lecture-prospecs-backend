import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";

extendZodWithOpenApi(z);

const UPLOAD_TAG = "Upload";

export const UploadResponseSchema = z
    .object({
        url: z.url().openapi({
            example: "https://firebasestorage.googleapis.com/v0/b/...",
            description: "업로드된 이미지의 URL",
        }),
    })
    .openapi("UploadResponse");

registry.registerPath({
    method: "post",
    path: "/uploads",
    tags: [UPLOAD_TAG],
    summary: "이미지 업로드",
    description: "이미지 파일을 업로드하고 URL을 반환받습니다.",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "multipart/form-data": {
                    schema: z.object({
                        file: z.any().openapi({
                            type: "string",
                            format: "binary",
                            description: "업로드할 이미지 파일 (jpg, png 등)",
                        }),
                        folder: z
                            .enum(["products", "reviews", "profiles", "inquiries", "etc"])
                            .optional()
                            .default("etc")
                            .openapi({ description: "저장할 경로 (기본값: etc)" }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: "업로드 성공",
            content: {
                "application/json": {
                    schema: UploadResponseSchema,
                },
            },
        },
        400: { description: "파일이 없거나 잘못된 요청" },
        500: { description: "서버 업로드 실패" },
    },
});
