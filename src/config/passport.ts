import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { prisma } from './prisma'; // prisma 인스턴스 경로 확인
import { User } from '@prisma/client';

// .env에서 시크릿 키 가져오기 (없으면 에러 처리 또는 기본값)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
    id: number;
    iat: number;
    exp: number;
}

const opts = {
    // Bearer Token 방식 (Authorization: Bearer <token>)
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
};

export const jwtStrategy = new JwtStrategy(opts, async (jwt_payload: JwtPayload, done: VerifiedCallback) => {
    try {
        // Payload에 있는 ID로 유저 조회
        const user: User | null = await prisma.user.findUnique({
            where: { id: jwt_payload.id },
        });

        if (user) {
            // 비밀번호는 제외하고 req.user에 넘기는 것이 보안상 좋습니다.
            // (타입 에러 방지를 위해 User 타입 전체를 넘기거나, Omit 유틸리티 사용)
            // 여기서는 편의상 user 전체를 넘기되, Controller에서 주의해서 사용합니다.
            return done(null, user);
        } else {
            return done(null, false); // 유저가 없으면 인증 실패
        }
    } catch (error) {
        return done(error, false); // DB 에러 등
    }
});