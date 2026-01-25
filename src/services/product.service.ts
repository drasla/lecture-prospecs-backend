import { ProductGender, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { CreateProductInput, ProductListQuery } from "../schemas/product.schema";

export const productService = {
    async createProduct(data: CreateProductInput) {
        // 1. 상품 코드 중복 체크
        for (const color of data.colors) {
            const exists = await prisma.productColor.findUnique({
                where: { productCode: color.productCode },
            });
            if (exists) {
                throw new HttpException(409, `이미 존재하는 상품 코드입니다: ${color.productCode}`);
            }
        }

        // 2. 카테고리 존재 확인 (Prisma FK 에러 방지)
        const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
        if (!category) {
            throw new HttpException(404, "존재하지 않는 카테고리입니다.");
        }

        // 3. 트랜잭션 생성
        return prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                summary: data.summary,
                price: data.price,
                categoryId: data.categoryId,
                style: data.style,
                gender: data.gender,
                material: data.material,
                sizeInfo: data.sizeInfo,
                manufacturer: data.manufacturer,
                originCountry: data.originCountry,
                careInstructions: data.careInstructions,
                manufactureDate: data.manufactureDate,
                qualityAssurance: data.qualityAssurance,
                asPhone: data.asPhone,
                isNew: data.isNew,
                isBest: data.isBest,

                colors: {
                    create: data.colors.map(color => ({
                        productCode: color.productCode,
                        colorName: color.colorName,
                        hexCode: color.hexCode,
                        colorInfo: color.colorInfo,
                        images: {
                            create: color.images.map(url => ({ url })),
                        },
                        sizes: {
                            create: color.sizes.map(s => ({
                                size: s.size,
                                stock: s.stock,
                            })),
                        },
                    })),
                },
            },
            include: {
                category: true,
                colors: {
                    include: { images: true, sizes: true },
                },
            },
        });
    },

    // ------------------------------------------------
    // [Public] 목록 조회
    // ------------------------------------------------
    async getProducts(params: ProductListQuery) {
        const { page, limit, categoryId, styles, genders, sizes } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {};

        if (categoryId) where.categoryId = categoryId;
        if (styles && styles.length > 0) where.style = { in: styles };

        if (genders && genders.length > 0) {
            const searchGenders = new Set(genders);
            if (searchGenders.has(ProductGender.MALE) || searchGenders.has(ProductGender.FEMALE)) {
                searchGenders.add(ProductGender.COMMON);
            }
            where.gender = { in: Array.from(searchGenders) };
        }

        if (sizes && sizes.length > 0) {
            where.colors = {
                some: {
                    sizes: {
                        some: { size: { in: sizes } },
                    },
                },
            };
        }

        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    category: true,
                    colors: {
                        include: { images: true, sizes: true },
                    },
                },
            }),
        ]);

        return {
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
            data: products,
        };
    },

    // ------------------------------------------------
    // [Public] 상세 조회
    // ------------------------------------------------
    async getProductById(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                colors: {
                    include: {
                        images: true,
                        sizes: { orderBy: { id: "asc" } },
                    },
                },
            },
        });

        if (!product) {
            throw new HttpException(404, "상품을 찾을 수 없습니다.");
        }
        return product;
    },

    // ------------------------------------------------
    // [Admin] 상품 수정
    // ------------------------------------------------
    async updateProduct(id: number, data: CreateProductInput) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new HttpException(404, "수정할 상품을 찾을 수 없습니다.");

        try {
            return await prisma.$transaction(async tx => {
                await tx.productColor.deleteMany({
                    where: { productId: id },
                });

                // 2. 업데이트
                return tx.product.update({
                    where: { id },
                    data: {
                        name: data.name,
                        description: data.description,
                        summary: data.summary,
                        price: data.price,
                        categoryId: data.categoryId,
                        style: data.style,
                        gender: data.gender,

                        // 메타 정보
                        material: data.material,
                        sizeInfo: data.sizeInfo,
                        manufacturer: data.manufacturer,
                        originCountry: data.originCountry,
                        careInstructions: data.careInstructions,
                        manufactureDate: data.manufactureDate,
                        qualityAssurance: data.qualityAssurance,
                        asPhone: data.asPhone,
                        isNew: data.isNew,
                        isBest: data.isBest,

                        // 새 색상 생성
                        colors: {
                            create: data.colors.map(color => ({
                                productCode: color.productCode,
                                colorName: color.colorName,
                                hexCode: color.hexCode,
                                colorInfo: color.colorInfo,
                                images: {
                                    create: color.images.map(url => ({ url })),
                                },
                                sizes: {
                                    create: color.sizes.map(s => ({
                                        size: s.size,
                                        stock: s.stock,
                                    })),
                                },
                            })),
                        },
                    },
                    include: {
                        colors: { include: { images: true, sizes: true } },
                    },
                });
            });
        } catch (error: any) {
            if (error.code === "P2003") {
                throw new HttpException(
                    409,
                    "이 상품은 이미 주문/장바구니에 담겨 있어 옵션을 전체 수정할 수 없습니다.",
                );
            }
            throw error;
        }
    },

    // ------------------------------------------------
    // [Admin] 삭제
    // ------------------------------------------------
    async deleteProduct(id: number) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new HttpException(404, "삭제할 상품을 찾을 수 없습니다.");

        try {
            return await prisma.product.delete({
                where: { id },
            });
        } catch (error: any) {
            if (error.code === "P2003") {
                throw new HttpException(409, "주문 내역이 존재하는 상품은 삭제할 수 없습니다.");
            }
            throw error;
        }
    },
};
