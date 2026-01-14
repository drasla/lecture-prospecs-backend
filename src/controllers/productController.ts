import { Request, Response } from 'express';
import { productService, CreateProductInput } from '../services/productService';

export const productController = {
    // 생성
    create: async (req: Request<{}, {}, CreateProductInput>, res: Response) => {
        try {
            const product = await productService.createProduct(req.body);
            res.status(201).json({ message: 'Product created successfully', product });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message.startsWith('DUPLICATE_CODE')) {
                    res.status(409).json({ message: error.message });
                } else {
                    console.error(error);
                    res.status(500).json({ message: 'Server error', error: error.message });
                }
            }
        }
    },

    // 목록 조회
    getList: async (req: Request, res: Response) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

            const result = await productService.getProducts(page, limit, categoryId);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },

    // 상세 조회
    getDetail: async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = Number(req.params.id);
            const product = await productService.getProductById(id);
            res.status(200).json(product);
        } catch (error: unknown) {
            if (error instanceof Error && error.message === 'NOT_FOUND') {
                res.status(404).json({ message: 'Product not found' });
            } else {
                res.status(500).json({ message: 'Server error' });
            }
        }
    },

    // 수정
    update: async (req: Request<{ id: string }, {}, CreateProductInput>, res: Response) => {
        try {
            const id = Number(req.params.id);
            const product = await productService.updateProduct(id, req.body);
            res.status(200).json({ message: 'Product updated successfully', product });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === 'NOT_FOUND') {
                    res.status(404).json({ message: 'Product not found' });
                } else {
                    console.error(error);
                    res.status(500).json({ message: 'Server error', error: error.message });
                }
            }
        }
    },

    // 삭제
    delete: async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = Number(req.params.id);
            await productService.deleteProduct(id);
            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error: unknown) {
            if (error instanceof Error && error.message === 'NOT_FOUND') {
                res.status(404).json({ message: 'Product not found' });
            } else {
                res.status(500).json({ message: 'Server error' });
            }
        }
    }
};