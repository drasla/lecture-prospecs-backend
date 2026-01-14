import { ProductGender, ProductStyle, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma"; // 경로 확인 필요

// [신규] 목록 조회용 파라미터 정의
interface GetProductsParams {
    page: number;
    limit: number;
    categoryId?: number;
    styles?: ProductStyle[];
    genders?: ProductGender[];
    sizes?: string[];
}

// 입력 데이터 타입 정의 (style, gender 추가됨)
export interface CreateProductInput {
    name: string;
    description: string;
    summary?: string;
    price: number;
    categoryId: number;

    // [신규 필드] 필터링용 속성
    style: ProductStyle; // 예: RACING, JACKET...
    gender: ProductGender; // 예: MALE, FEMALE, COMMON

    // 메타 정보
    material?: string;
    sizeInfo?: string;
    manufacturer?: string;
    originCountry?: string;
    careInstructions?: string;
    manufactureDate?: string;
    qualityAssurance?: string;
    asPhone?: string;

    // 태그
    isNew?: boolean;
    isBest?: boolean;

    // 중첩 데이터 (색상 -> 사이즈/이미지)
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
    // [생성] 상품 + 속성(style, gender) + 색상 + 이미지 + 사이즈 트랜잭션 생성
    async createProduct(data: CreateProductInput) {
        // 상품 코드 중복 체크
        for (const color of data.colors) {
            const exists = await prisma.productColor.findUnique({
                where: { productCode: color.productCode },
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

                // [수정] 신규 필드 저장
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

                // Nested Write: 색상 -> (이미지, 사이즈)
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
                            create: color.sizes.map(size => ({
                                size: size.size,
                                stock: size.stock,
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

    // [목록 조회] 페이지네이션 & 필터링 (styles, genders, sizes)
    getProducts: async ({ page, limit, categoryId, styles, genders, sizes }: GetProductsParams) => {
        const skip = (page - 1) * limit;

        // Where 조건 동적 생성
        const where: Prisma.ProductWhereInput = {};

        // 1. 카테고리 필터
        if (categoryId) {
            where.categoryId = categoryId;
        }

        // 2. 종류 필터 (배열)
        if (styles && styles.length > 0) {
            where.style = { in: styles };
        }

        // 3. 성별 필터 (배열)
        if (genders && genders.length > 0) {
            const searchGenders = new Set(genders);
            if (searchGenders.has(ProductGender.MALE) || searchGenders.has(ProductGender.FEMALE)) {
                searchGenders.add(ProductGender.COMMON);
            }
            where.gender = { in: Array.from(searchGenders) };
        }

        // 4. 사이즈 필터 (Relation Filter)
        if (sizes && sizes.length > 0) {
            where.colors = {
                some: {
                    sizes: {
                        some: {
                            size: { in: sizes },
                            // stock: { gt: 0 } // 필요 시 품절 상품 제외
                        },
                    },
                },
            };
        }

        // DB 조회 병렬 실행
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
                        include: {
                            images: true, // 대표 이미지
                            sizes: true, // 사이즈 정보
                        },
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
                            orderBy: { id: "asc" },
                        },
                    },
                },
            },
        });

        if (!product) throw new Error("NOT_FOUND");
        return product;
    },

    // [수정] style, gender 포함하여 업데이트
    async updateProduct(id: number, data: CreateProductInput) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new Error("NOT_FOUND");

        // 트랜잭션: 기존 색상(및 하위) 삭제 -> 정보 업데이트 -> 새 색상(및 하위) 생성
        return prisma.$transaction(async tx => {
            // 1. 기존 색상 연결 끊기/삭제
            await tx.productColor.deleteMany({
                where: { productId: id },
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

                    // [수정] 신규 필드 업데이트
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
                                create: color.sizes.map(size => ({
                                    size: size.size,
                                    stock: size.stock,
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
    },

    // [삭제]
    async deleteProduct(id: number) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new Error("NOT_FOUND");

        return prisma.product.delete({
            where: { id },
        });
    },
};
