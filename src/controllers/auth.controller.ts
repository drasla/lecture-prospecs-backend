import { NextFunction, Request, Response } from "express";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { authService } from "../services/auth.service";

export const authController = {
    // 회원가입
    register: async (req: Request<{}, {}, RegisterInput>, res: Response, next: NextFunction) => {
        try {
            const user = await authService.register(req.body);
            res.status(201).json({ message: "User created successfully", user });
        } catch (error) {
            next(error);
        }
    },

    // 로그인
    login: async (req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) => {
        try {
            const { user, token } = await authService.login(req.body);
            res.status(200).json({ message: "Login successful", token, user });
        } catch (error) {
            next(error);
        }
    },

    // 내 정보 조회
    getMe: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // req.user는 미들웨어를 거쳤다면 존재함.
            // types/express.d.ts 덕분에 any 없이 접근 가능 (단, optional이므로 체크 필요)
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const user = await authService.getMe(userId);
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    },
};
