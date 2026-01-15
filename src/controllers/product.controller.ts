import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';
import { ProductGender, ProductStyle } from '@prisma/client';

// 쿼리 파라미터 배열 변환 유틸
const parseArrayQuery = (query: any): string[] => {
    if (!query) return [];
    return Array.isArray(query) ? (query as string[]) : [query as string];
};

export const productController = {
    // [사용자용] 상품 목록 조회
    getProducts: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 40; // 사용자는 한 번에 많이 봄
            const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

            const styles = parseArrayQuery(req.query.styles);
            const genders = parseArrayQuery(req.query.genders);
            const sizes = parseArrayQuery(req.query.sizes);

            // 서비스 호출 (로직은 동일하게 재사용하거나, 필요 시 getShopProducts 별도 생성)
            const result = await productService.getProducts({
                page,
                limit,
                categoryId,
                styles: styles as ProductStyle[],
                genders: genders as ProductGender[],
                sizes,
                // isPublic: true // 추후 '공개 상품만 조회' 같은 옵션 추가 가능
            });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // [사용자용] 상품 상세 조회
    getProductDetail: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const product = await productService.getProductById(id);
            res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    }
};