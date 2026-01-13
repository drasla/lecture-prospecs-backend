import { User } from '@prisma/client';

// Prisma User 모델을 그대로 사용하거나, Password를 뺀 타입을 사용
export type UserPayload = User;

declare global {
    namespace Express {
        // Passport는 기본적으로 User 인터페이스를 사용하므로
        // 아래와 같이 오버라이딩 해주면 좋습니다.
        interface User extends UserPayload {}

        interface Request {
            user?: UserPayload;
        }
    }
}