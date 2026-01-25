import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { CreateProductInput, ProductListQuery } from "../schemas/product.schema";

export const adminProductController = {
    // ------------------------------------------------
    // [Admin] 상품 생성
    // ------------------------------------------------
    create: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 미들웨어(validateBody)를 통과했으므로 타입 단언 사용
            const input = req.body as CreateProductInput;

            const product = await productService.createProduct(input);

            res.status(201).json({
                message: "상품이 성공적으로 생성되었습니다.",
                product,
            });
        } catch (error) {
            next(error);
        }
    },

    // ------------------------------------------------
    // [Admin] 목록 조회
    // ------------------------------------------------
    getList: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 미들웨어(validateQuery)를 통과했으므로 타입 단언 사용
            // 수동으로 배열 변환(parseArrayQuery)할 필요가 없습니다.
            const query = req.query as unknown as ProductListQuery;

            const result = await productService.getProducts(query);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // ------------------------------------------------
    // [Admin] 상세 조회
    // ------------------------------------------------
    getDetail: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            // ID 유효성 검사는 Zod Params 스키마를 쓰거나, 간단히 여기서 체크
            if (isNaN(id)) throw new Error("INVALID_ID"); // 또는 Global Error Handler가 500 처리

            const product = await productService.getProductById(id);
            res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    },

    // ------------------------------------------------
    // [Admin] 수정
    // ------------------------------------------------
    update: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const input = req.body as CreateProductInput;

            const product = await productService.updateProduct(id, input);

            res.status(200).json({
                message: "상품이 성공적으로 수정되었습니다.",
                product,
            });
        } catch (error) {
            next(error);
        }
    },

    // ------------------------------------------------
    // [Admin] 삭제
    // ------------------------------------------------
    delete: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            await productService.deleteProduct(id);

            res.status(200).json({ message: "상품이 성공적으로 삭제되었습니다." });
        } catch (error) {
            next(error);
        }
    },
};
