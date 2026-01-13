import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 토큰 생성
export const generateToken = (userId: number) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1d' }); // 1일 유효
};

// 비밀번호 해싱
export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// 비밀번호 비교
export const comparePassword = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
};