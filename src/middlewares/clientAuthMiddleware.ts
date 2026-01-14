import { Request, Response, NextFunction } from 'express';

export const validateClientKey = (req: Request, res: Response, next: NextFunction): void => {
    // 1. Swagger 문서 관련 경로는 검사 제외 (브라우저에서 직접 접속해야 하므로)
    if (req.path.startsWith('/api-docs')) {
        next();
        return;
    }

    // 2. Preflight 요청(OPTIONS)은 통과시킴 (CORS 처리를 위해 필수)
    if (req.method === 'OPTIONS') {
        next();
        return;
    }

    // 3. 헤더 값 가져오기
    const clientKey = req.headers['x-client-key'];
    const validKey = process.env.API_CLIENT_KEY;

    // 서버 설정 에러 방지
    if (!validKey) {
        console.error("FATAL ERROR: API_CLIENT_KEY is not defined in .env");
        res.status(500).json({ message: "Server configuration error" });
        return;
    }

    // 4. 키 검증
    if (!clientKey || clientKey !== validKey) {
        // 키가 없거나 틀리면 403 Forbidden 리턴
        res.status(403).json({
            message: "Forbidden: Invalid or missing 'x-client-key' header."
        });
        return;
    }

    // 5. 통과
    next();
};