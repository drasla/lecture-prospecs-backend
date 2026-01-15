import { Request, Response } from "express";
import { categoryService } from "../services/categoryService";

interface CreateCategoryBody {
    name: string;
    path: string;
    parentId?: number;
}

interface UpdateCategoryBody {
    name: string;
    path: string;
}

interface CategoryBody {
    name: string;
}

export const adminCategoryController = {
    // 생성
    create: async (req: Request<{}, {}, CreateCategoryBody>, res: Response) => {
        try {
            const { name, path, parentId } = req.body;

            if (!name || !path) {
                res.status(400).json({ message: 'Name and Path are required' });
                return;
            }

            // [수정] path 전달
            const category = await categoryService.createCategory(name, path, parentId);
            res.status(201).json({ message: 'Category created', category });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === 'ALREADY_EXISTS') {
                    res.status(409).json({ message: 'Category path already exists in this level' });
                } else {
                    // ... 에러 처리
                    res.status(500).json({ message: 'Server error', error: error.message });
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
    update: async (req: Request<{ id: string }, {}, UpdateCategoryBody>, res: Response) => {
        try {
            const id = Number(req.params.id);
            const { name, path } = req.body;

            if (isNaN(id)) {
                res.status(400).json({ message: 'Invalid ID format' });
                return;
            }

            // 유효성 검사
            if (!name || !path) {
                res.status(400).json({ message: 'Name and Path are required' });
                return;
            }

            const category = await categoryService.updateCategory(id, name, path);
            res.status(200).json({ message: 'Category updated', category });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === 'NOT_FOUND') {
                    res.status(404).json({ message: 'Category not found' });
                } else if (error.message === 'ALREADY_EXISTS') {
                    res.status(409).json({ message: 'Category path already exists in this level' });
                } else {
                    res.status(500).json({ message: 'Server error', error: error.message });
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
