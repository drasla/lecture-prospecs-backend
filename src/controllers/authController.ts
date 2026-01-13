import { Request, Response } from "express";
import { authService, LoginInput, RegisterInput } from "../services/authService";

export const authController = {
    // 회원가입
    register: async (req: Request<{}, {}, RegisterInput>, res: Response) => {
        try {
            const user = await authService.register(req.body);
            res.status(201).json({ message: "User created successfully", user });
        } catch (error: unknown) {
            if (error instanceof Error) {
                // 에러 처리 분기
                switch (error.message) {
                    case "ALREADY_EXISTS":
                        res.status(409).json({ message: "Email already exists" });
                        break;
                    case "PASSWORD_MISMATCH": // 비밀번호 불일치
                        res.status(400).json({ message: "Password confirmation does not match" });
                        break;
                    default:
                        res.status(500).json({ message: "Server error", error: error.message });
                }
            } else {
                res.status(500).json({ message: "Unknown error occurred" });
            }
        }
    },

    // 로그인
    login: async (req: Request<{}, {}, LoginInput>, res: Response) => {
        try {
            const { user, token } = await authService.login(req.body);
            res.status(200).json({ message: "Login successful", token, user });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === "INVALID_CREDENTIALS") {
                    res.status(401).json({ message: "Invalid email or password" });
                } else {
                    res.status(500).json({ message: "Server error", error: error.message });
                }
            }
        }
    },

    // 내 정보 조회
    getMe: async (req: Request, res: Response) => {
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
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(404).json({ message: "User not found" });
            }
        }
    },
};
