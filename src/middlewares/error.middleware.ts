import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../utils/exception.utils';

export const errorMiddleware = (error: HttpException | Error, req: Request, res: Response, _next: NextFunction) => {
    const status = (error instanceof HttpException) ? error.statusCode : 500;
    const message = error.message || '알 수 없는 서버 오류가 발생했습니다.';

    console.error(`[Error] ${req.method} ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);

    res.status(status).json({
        message: message,
    });
};