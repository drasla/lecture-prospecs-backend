import { Request, Response, NextFunction } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
    // authenticateJwt를 통과했다면 req.user가 존재함
    const user = req.user;

    if (!user || user.role !== "ADMIN") {
        res.status(403).json({ message: "Forbidden: Admin access required" });
        return;
    }

    next();
};
