import { prisma } from "../config/prisma";

export const categoryService = {
    async createCategory(name: string, path: string, parentId?: number) {
        // 1. 중복 체크 (같은 부모 아래에서 path 중복 불가)
        const existing = await prisma.category.findFirst({
            where: {
                path,
                parentId: parentId || null
            },
        });

        if (existing) {
            throw new Error('ALREADY_EXISTS');
        }

        // 2. 부모 확인
        if (parentId) {
            const parent = await prisma.category.findUnique({ where: { id: parentId } });
            if (!parent) throw new Error('PARENT_NOT_FOUND');
        }

        // 3. 생성
        return prisma.category.create({
            data: {
                name,
                path, // 주소값 저장
                parentId: parentId || null,
            },
        });
    },

    // 전체 조회 (기존 유지)
    async getAllCategories() {
        return prisma.category.findMany({
            orderBy: { id: "asc" },
        });
    },

    // 카테고리 수정
    async updateCategory(id: number, name: string, path: string) {
        // 1. 수정할 카테고리가 존재하는지 확인
        const target = await prisma.category.findUnique({ where: { id } });
        if (!target) throw new Error("NOT_FOUND");

        // 2. Path 중복 체크 (Path가 변경되는 경우에만)
        // 같은 부모(parentId)를 가진 형제들 중에서 Path가 겹치는지 확인
        if (path !== target.path) {
            const duplicate = await prisma.category.findFirst({
                where: {
                    parentId: target.parentId, // 같은 레벨(부모) 내에서
                    path: path,               // 바꿀 Path가 있는지 확인
                    NOT: { id: id }           // 자기 자신은 제외
                }
            });

            if (duplicate) {
                throw new Error("ALREADY_EXISTS");
            }
        }

        // 3. 업데이트 수행
        return prisma.category.update({
            where: { id },
            data: {
                name,
                path,
            },
        });
    },

    // 카테고리 삭제
    async deleteCategory(id: number) {
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) throw new Error("NOT_FOUND");

        return prisma.category.delete({
            where: { id },
        });
    },
};
