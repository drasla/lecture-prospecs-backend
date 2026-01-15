// src/controllers/category.controller.ts
import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/categoryService"; // 기존 서비스 재사용

export const categoryController = {
    // [사용자용] 카테고리 전체 목록 조회 (트리 구조)
    getList: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 서비스 로직은 기존과 동일하게 전체 트리를 가져옵니다.
            const categories = await categoryService.getAllCategories();
            res.status(200).json(categories);
        } catch (error) {
            next(error);
        }
    },
};