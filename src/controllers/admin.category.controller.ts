import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import { CreateCategoryInput, UpdateCategoryInput } from "../schemas/admin.category.schema";
import { HttpException } from "../utils/exception.utils";

export const adminCategoryController = {
    // 생성
    create: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 미들웨어 검증 완료된 데이터
            const { name, path, parentId } = req.body as CreateCategoryInput;

            const category = await categoryService.createCategory(name, path, parentId);

            res.status(201).json({
                message: "Category created",
                category,
            });
        } catch (error) {
            next(error);
        }
    },

    // 목록 조회
    getList: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await categoryService.getAllCategories();
            res.status(200).json(categories);
        } catch (error) {
            next(error);
        }
    },

    // 수정
    update: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) throw new HttpException(400, "Invalid ID format");

            const { name, path } = req.body as UpdateCategoryInput;

            const category = await categoryService.updateCategory(id, name, path);

            res.status(200).json({
                message: "Category updated",
                category,
            });
        } catch (error) {
            next(error);
        }
    },

    // 삭제
    delete: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) throw new HttpException(400, "Invalid ID format");

            await categoryService.deleteCategory(id);

            res.status(200).json({ message: "Category deleted" });
        } catch (error) {
            next(error);
        }
    },
};
