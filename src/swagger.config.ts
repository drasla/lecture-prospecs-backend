import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "My Express API",
            version: "1.0.0",
            description: "타입스크립트 Express 프로젝트를 위한 API 문서입니다.",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "로컬 서버",
            },
        ],
    },
    // 문서를 만들 파일들의 경로 (중요!)
    // src 폴더 내의 모든 routes.ts 파일들을 읽겠다는 뜻입니다.
    apis: ["./src/routes/*.ts", "./src/models/*.ts"],
};

export const specs = swaggerJsdoc(options);
