import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '@prisma/client';

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('jwt', { session: false }, (err: Error | null, user: User | false, info: any) => {

        // 1. 서버 에러 발생 시
        if (err) {
            return next(err);
        }

        // 2. 유저가 없거나 토큰이 유효하지 않을 때
        if (!user) {
            // info에는 "No auth token", "jwt expired" 등의 메시지가 들어있습니다.
            const message = info ? info.message : 'Unauthorized access';
            res.status(401).json({ message });
            return;
        }

        // 3. 성공 시 req.user에 유저 정보 할당
        req.user = user;
        next();
    })(req, res, next);
};