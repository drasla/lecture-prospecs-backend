import { Gender } from "@prisma/client";
import { prisma } from '../config/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.utils';

// 회원가입 입력 타입 정의 (Schema 기반 필수값)
export interface RegisterInput {
    email:           string;
    emailOptIn:      boolean; // 2. 이메일 수신동의
    password:        string;
    passwordConfirm: string;  // 4. 비밀번호 확인 (DB 저장 X)
    name:            string;
    phone:           string;  // 6. 휴대폰
    smsOptIn:        boolean; // 7. SMS 수신동의
    birthdate:       string;  // 8. 생년월일
    gender:          Gender;  // 9. 성별 ('MALE' | 'FEMALE')

    zipCode?:         string;
    address1?:        string;
    address2?:        string;
}

export interface LoginInput {
    email:    string;
    password: string;
}

export const authService = {
    // 회원가입
    async register(data: RegisterInput) {
        // [검증 1] 비밀번호 일치 확인
        if (data.password !== data.passwordConfirm) {
            throw new Error('PASSWORD_MISMATCH');
        }

        // [검증 2] 이메일 중복 체크
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new Error('ALREADY_EXISTS');
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
                // role은 default(USER) 사용
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
            throw new Error('INVALID_CREDENTIALS');
        }

        // 2. 비밀번호 확인
        const isMatch = await comparePassword(data.password, user.password);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
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

        if (!user) throw new Error('USER_NOT_FOUND');

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
};