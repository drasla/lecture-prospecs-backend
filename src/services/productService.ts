import { prisma } from '../config/prisma';

// 입력 데이터 타입 정의
export interface CreateProductInput {
    name: string;
    description: string;
    summary?: string;
    price: number;
    categoryId: number;

    // 메타 정보
    material?: string;
    manufacturer?: string;
    originCountry?: string;
    careInstructions?: string;
    manufactureDate?: string;
    qualityAssurance?: string;
    asPhone?: string;

    // 태그
    isNew?: boolean;
    isBest?: boolean;

    // 중첩 데이터
    colors: {
        productCode: string; // 고유 코드 (예: PW0UW25F303)
        colorName: string;
        hexCode?: string;
        colorInfo?: string;
        images: string[]; // 이미지 URL 배열
        sizes: {
            size: string;
            stock: number;
        }[];
    }[];
}

export const productService = {
    // [생성] 상품 + 색상 + 이미지 + 사이즈 트랜잭션 생성
    async createProduct(data: CreateProductInput) {
        // 상품 코드 중복 체크
        for (const color of data.colors) {
            const exists = await prisma.productColor.findUnique({
                where: { productCode: color.productCode }
            });
            if (exists) throw new Error(`DUPLICATE_CODE: ${color.productCode}`);
        }

        return prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                summary: data.summary,
                price: data.price,
                categoryId: data.categoryId,

                material: data.material,
                manufacturer: data.manufacturer,
                originCountry: data.originCountry,
                careInstructions: data.careInstructions,
                manufactureDate: data.manufactureDate,
                qualityAssurance: data.qualityAssurance,
                asPhone: data.asPhone,
                isNew: data.isNew,
                isBest: data.isBest,

                // Nested Write: 색상 -> (이미지, 사이즈)
                colors: {
                    create: data.colors.map(color => ({
                        productCode: color.productCode,
                        colorName: color.colorName,
                        hexCode: color.hexCode,
                        colorInfo: color.colorInfo,
                        // 이미지 연결
                        images: {
                            create: color.images.map(url => ({ url }))
                        },
                        // 사이즈 연결
                        sizes: {
                            create: color.sizes.map(size => ({
                                size: size.size,
                                stock: size.stock
                            }))
                        }
                    }))
                }
            },
            include: {
                category: true,
                colors: {
                    include: { images: true, sizes: true }
                }
            }
        });
    },

    // [목록 조회] 페이지네이션 & 필터링
    async getProducts(page: number = 1, limit: number = 10, categoryId?: number) {
        const skip = (page - 1) * limit;
        const whereCondition = categoryId ? { categoryId } : {};

        const [total, products] = await prisma.$transaction([
            prisma.product.count({ where: whereCondition }),
            prisma.product.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: true,
                    // 목록에서는 대표 이미지(첫 번째 색상의 첫 번째 이미지)만 가져오면 효율적임
                    colors: {
                        take: 1,
                        include: {
                            images: { take: 1 }
                        }
                    }
                }
            })
        ]);

        return {
            products,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit)
            }
        };
    },

    // [상세 조회]
    async getProductById(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                colors: {
                    include: {
                        images: true,
                        sizes: {
                            orderBy: { id: 'asc' } // 사이즈 순서 정렬 권장 (230, 240...)
                        }
                    }
                }
            }
        });

        if (!product) throw new Error('NOT_FOUND');
        return product;
    },

    // [수정] 전체 덮어쓰기 전략 (Cleanest way for deep nested relations)
    async updateProduct(id: number, data: CreateProductInput) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new Error('NOT_FOUND');

        // 트랜잭션: 기존 색상(및 하위) 삭제 -> 정보 업데이트 -> 새 색상(및 하위) 생성
        return prisma.$transaction(async (tx) => {
            // 1. 기존 색상 연결 끊기/삭제 (Cascade 설정에 따라 자동 삭제됨)
            // ProductColor가 삭제되면 ProductImage, ProductSize도 Cascade 삭제됨
            await tx.productColor.deleteMany({
                where: { productId: id }
            });

            // 2. 상품 정보 및 새 관계 업데이트
            return tx.product.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    summary: data.summary,
                    price: data.price,
                    categoryId: data.categoryId,

                    material: data.material,
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
                                create: color.images.map(url => ({ url }))
                            },
                            sizes: {
                                create: color.sizes.map(size => ({
                                    size: size.size,
                                    stock: size.stock
                                }))
                            }
                        }))
                    }
                },
                include: {
                    colors: { include: { images: true, sizes: true } }
                }
            });
        });
    },

    // [삭제]
    async deleteProduct(id: number) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new Error('NOT_FOUND');

        // Cascade 설정이 되어 있다면 관련 colors, images, sizes 모두 삭제됨
        return prisma.product.delete({
            where: { id }
        });
    }
};