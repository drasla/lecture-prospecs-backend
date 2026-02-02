import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

// 1. 레지스트리 생성 (여기에 API 명세들을 등록할 겁니다)
export const registry = new OpenAPIRegistry();

// 2. Bearer Auth 등록 (로그인용)
registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
});

// 3. JSON 생성 함수 (나중에 app.ts에서 호출)
export function generateOpenApiDocs() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "Prospecs 쇼핑몰 API",
            version: "1.0.0",
        },
        servers: [{ url: "/api" }],
        "x-tagGroups": [
            {
                name: "공용 API",
                tags: [
                    "Auth",
                    "Category",
                    "Product",
                    "Cart",
                    "Order",
                    "Review",
                    "Inquiry",
                    "Upload",
                ],
            },
            {
                name: "관리자 API",
                tags: [
                    "Admin/Category",
                    "Admin/Product",
                    "Admin/Order",
                    "Admin/Inquiry",
                ],
            },
        ],
    });
}
