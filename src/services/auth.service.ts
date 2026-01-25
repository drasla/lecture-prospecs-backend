import { prisma } from "../config/prisma";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.utils";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { HttpException } from "../utils/exception.utils";

export const authService = {
    // 회원가입
    async register(data: RegisterInput) {
        // [검증 1] 비밀번호 일치 확인
        if (data.password !== data.passwordConfirm) {
            throw new HttpException(400, "비밀번호가 일치하지 않습니다.");
        }

        // [검증 2] 이메일 중복 체크
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new HttpException(409, "이미 존재하는 이메일입니다.");
        }

        // [로직] 비밀번호 해싱
        const hashedPassword = await hashPassword(data.password);

        // [로직] DB 저장 (passwordConfirm은 제외하고 저장)
        // 구조 분해 할당으로 불필요한 필드 제거
        const { passwordConfirm, ...userData } = data;

        const newUser = await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
            },
        });

        // 응답 시 해싱된 비밀번호 제외
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    },

    // 로그인
    async login(data: LoginInput) {
        // 1. 사용자 찾기
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new HttpException(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // 2. 비밀번호 확인
        const isMatch = await comparePassword(data.password, user.password);
        if (!isMatch) {
            throw new HttpException(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // 3. 토큰 발급
        const token = generateToken(user.id);

        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    },

    // 내 정보 조회
    async getMe(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new HttpException(404, "사용자를 찾을 수 없습니다.");
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },
};
