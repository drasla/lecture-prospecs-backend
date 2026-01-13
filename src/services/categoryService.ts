import { prisma } from "../config/prisma";

export const categoryService = {
    // 카테고리 생성
    async createCategory(name: string) {
        // 중복 이름 체크
        const existing = await prisma.category.findUnique({
            where: { name },
        });

        if (existing) {
            throw new Error("ALREADY_EXISTS");
        }

        return prisma.category.create({
            data: { name },
        });
    },

    // 카테고리 전체 조회
    async getAllCategories() {
        return prisma.category.findMany({
            orderBy: { id: "asc" }, // ID 순 정렬
        });
    },

    // 카테고리 수정
    async updateCategory(id: number, name: string) {
        // 존재하는지 확인
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) throw new Error("NOT_FOUND");

        // 이름 중복 체크 (자기 자신 제외)
        const duplicate = await prisma.category.findUnique({ where: { name } });
        if (duplicate && duplicate.id !== id) {
            throw new Error("ALREADY_EXISTS");
        }

        return prisma.category.update({
            where: { id },
            data: { name },
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
