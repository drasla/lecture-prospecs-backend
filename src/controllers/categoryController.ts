import { Request, Response } from "express";
import { categoryService } from "../services/categoryService";

interface CategoryBody {
    name: string;
}

export const categoryController = {
    // 생성
    create: async (req: Request<{}, {}, CategoryBody>, res: Response) => {
        try {
            const { name } = req.body;
            if (!name) {
                res.status(400).json({ message: "Name is required" });
                return;
            }

            const category = await categoryService.createCategory(name);
            res.status(201).json({ message: "Category created", category });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === "ALREADY_EXISTS") {
                    res.status(409).json({ message: "Category name already exists" });
                } else {
                    res.status(500).json({ message: "Server error", error: error.message });
                }
            }
        }
    },

    // 목록 조회
    getList: async (req: Request, res: Response) => {
        try {
            const categories = await categoryService.getAllCategories();
            res.status(200).json(categories);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(500).json({ message: "Server error", error: error.message });
            }
        }
    },

    // 수정
    update: async (req: Request<{ id: string }, {}, CategoryBody>, res: Response) => {
        try {
            const id = Number(req.params.id);
            const { name } = req.body;

            if (isNaN(id)) {
                res.status(400).json({ message: "Invalid ID format" });
                return;
            }
            if (!name) {
                res.status(400).json({ message: "Name is required" });
                return;
            }

            const category = await categoryService.updateCategory(id, name);
            res.status(200).json({ message: "Category updated", category });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === "NOT_FOUND") {
                    res.status(404).json({ message: "Category not found" });
                } else if (error.message === "ALREADY_EXISTS") {
                    res.status(409).json({ message: "Category name already exists" });
                } else {
                    res.status(500).json({ message: "Server error", error: error.message });
                }
            }
        }
    },

    // 삭제
    delete: async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ message: "Invalid ID format" });
                return;
            }

            await categoryService.deleteCategory(id);
            res.status(200).json({ message: "Category deleted" });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === "NOT_FOUND") {
                    res.status(404).json({ message: "Category not found" });
                } else {
                    // Prisma FK 제약조건 에러 등 처리 (상품이 연결된 카테고리 삭제 시)
                    res.status(500).json({
                        message: "Cannot delete category in use or server error",
                    });
                }
            }
        }
    },
};
