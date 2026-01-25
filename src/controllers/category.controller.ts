import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import { HttpException } from "../utils/exception.utils";

export const categoryController = {
    // 목록 조회
    getList: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await categoryService.getAllCategories();
            res.status(200).json(categories);
        } catch (error) {
            next(error);
        }
    },

    // 상세 조회
    getOne: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                // Zod로 Params 검증을 하지 않는다면 여기서 에러 처리
                throw new HttpException(400, "유효하지 않은 카테고리 ID입니다.");
            }

            const category = await categoryService.getCategoryById(id);
            res.status(200).json(category);
        } catch (error) {
            next(error);
        }
    },
};
