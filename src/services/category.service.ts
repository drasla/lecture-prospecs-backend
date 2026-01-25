import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";

export const categoryService = {
    // ------------------------------------
    // [Admin] 카테고리 생성
    // ------------------------------------
    async createCategory(name: string, path: string, parentId?: number) {
        // 1. 중복 체크
        const existing = await prisma.category.findFirst({
            where: { path, parentId: parentId || null },
        });

        if (existing) {
            throw new HttpException(409, "이미 존재하는 카테고리 경로입니다.");
        }

        // 2. 부모 확인
        if (parentId) {
            const parent = await prisma.category.findUnique({ where: { id: parentId } });
            if (!parent) {
                throw new HttpException(404, "부모 카테고리를 찾을 수 없습니다.");
            }
        }

        // 3. 생성
        return prisma.category.create({
            data: { name, path, parentId: parentId || null },
        });
    },

    // ------------------------------------
    // [Public] 전체 조회
    // ------------------------------------
    async getAllCategories() {
        return prisma.category.findMany({
            orderBy: { id: "asc" },
        });
    },

    // ------------------------------------
    // [Public] 상세 조회 (+ Breadcrumbs)
    // ------------------------------------
    async getCategoryById(id: number) {
        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            throw new HttpException(404, "카테고리를 찾을 수 없습니다.");
        }

        // Breadcrumbs 생성 (역추적)
        const breadcrumbs = [];
        let current: typeof category | null = category;

        while (current) {
            breadcrumbs.unshift({
                id: current.id,
                name: current.name,
                path: current.path,
            });

            if (current.parentId) {
                current = await prisma.category.findUnique({
                    where: { id: current.parentId },
                });
            } else {
                current = null;
            }
        }

        return {
            ...category,
            breadcrumbs,
        };
    },

    // ------------------------------------
    // [Admin] 수정
    // ------------------------------------
    async updateCategory(id: number, name: string, path: string) {
        const target = await prisma.category.findUnique({ where: { id } });
        if (!target) {
            throw new HttpException(404, "수정할 카테고리를 찾을 수 없습니다.");
        }

        // Path 중복 체크
        if (path !== target.path) {
            const duplicate = await prisma.category.findFirst({
                where: {
                    parentId: target.parentId,
                    path: path,
                    NOT: { id: id },
                },
            });

            if (duplicate) {
                throw new HttpException(409, "이미 존재하는 카테고리 경로입니다.");
            }
        }

        return prisma.category.update({
            where: { id },
            data: { name, path },
        });
    },

    // ------------------------------------
    // [Admin] 삭제
    // ------------------------------------
    async deleteCategory(id: number) {
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) {
            throw new HttpException(404, "삭제할 카테고리를 찾을 수 없습니다.");
        }

        return prisma.category.delete({
            where: { id },
        });
    },
};
