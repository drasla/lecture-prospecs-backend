import { Request, Response } from "express";
import { productService, CreateProductInput } from "../services/productService";
import { ProductGender, ProductStyle } from "@prisma/client";

// 쿼리 파라미터를 배열로 변환하는 유틸리티
const parseArrayQuery = (query: any): string[] => {
    if (!query) return [];
    return Array.isArray(query) ? (query as string[]) : [query as string];
};

export const adminProductController = {
    // 생성
    create: async (req: Request<{}, {}, CreateProductInput>, res: Response) => {
        try {
            const product = await productService.createProduct(req.body);
            res.status(201).json({ message: "Product created successfully", product });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message.startsWith("DUPLICATE_CODE")) {
                    res.status(409).json({ message: error.message });
                } else {
                    console.error(error);
                    res.status(500).json({ message: "Server error", error: error.message });
                }
            }
        }
    },

    // 목록 조회 (필터링 파라미터 파싱 추가)
    getList: async (req: Request, res: Response) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

            // [추가] 체크박스 필터링 파라미터 파싱 (배열 변환)
            const styles = parseArrayQuery(req.query.styles);
            const genders = parseArrayQuery(req.query.genders);
            const sizes = parseArrayQuery(req.query.sizes);

            // 서비스 호출
            const result = await productService.getProducts({
                page,
                limit,
                categoryId,
                styles: styles as ProductStyle[], // Enum 타입 캐스팅
                genders: genders as ProductGender[], // Enum 타입 캐스팅
                sizes,
            });

            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    },

    // 상세 조회
    getDetail: async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = Number(req.params.id);
            const product = await productService.getProductById(id);
            res.status(200).json(product);
        } catch (error: unknown) {
            if (error instanceof Error && error.message === "NOT_FOUND") {
                res.status(404).json({ message: "Product not found" });
            } else {
                res.status(500).json({ message: "Server error" });
            }
        }
    },

    // 수정
    update: async (req: Request<{ id: string }, {}, CreateProductInput>, res: Response) => {
        try {
            const id = Number(req.params.id);
            const product = await productService.updateProduct(id, req.body);
            res.status(200).json({ message: "Product updated successfully", product });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === "NOT_FOUND") {
                    res.status(404).json({ message: "Product not found" });
                } else {
                    console.error(error);
                    res.status(500).json({ message: "Server error", error: error.message });
                }
            }
        }
    },

    // 삭제
    delete: async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = Number(req.params.id);
            await productService.deleteProduct(id);
            res.status(200).json({ message: "Product deleted successfully" });
        } catch (error: unknown) {
            if (error instanceof Error && error.message === "NOT_FOUND") {
                res.status(404).json({ message: "Product not found" });
            } else {
                res.status(500).json({ message: "Server error" });
            }
        }
    },
};
