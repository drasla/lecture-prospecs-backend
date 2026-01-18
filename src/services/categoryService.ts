import { prisma } from "../config/prisma";

export const categoryService = {
    async createCategory(name: string, path: string, parentId?: number) {
        // 1. 중복 체크 (같은 부모 아래에서 path 중복 불가)
        const existing = await prisma.category.findFirst({
            where: {
                path,
                parentId: parentId || null,
            },
        });

        if (existing) {
            throw new Error("ALREADY_EXISTS");
        }

        // 2. 부모 확인
        if (parentId) {
            const parent = await prisma.category.findUnique({ where: { id: parentId } });
            if (!parent) throw new Error("PARENT_NOT_FOUND");
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

    // [수정/추가] 특정 카테고리 상세 조회 (+ Breadcrumbs)
    async getCategoryById(id: number) {
        // 1. 현재 카테고리 조회
        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            throw new Error("NOT_FOUND");
        }

        // 2. Breadcrumbs 생성 (역추적 로직)
        // 현재 카테고리부터 시작해서 부모가 null이 될 때까지 위로 올라감
        const breadcrumbs = [];
        let current: typeof category | null = category;

        while (current) {
            // 배열의 앞에 추가 (자식 -> 부모 순서로 탐색하므로 순서를 뒤집기 위함)
            breadcrumbs.unshift({
                id: current.id,
                name: current.name,
                path: current.path,
            });

            // 부모가 있으면 부모를 조회해서 current 교체, 없으면 루프 종료
            if (current.parentId) {
                current = await prisma.category.findUnique({
                    where: { id: current.parentId },
                });
            } else {
                current = null;
            }
        }

        // 3. 결과 반환 (기존 카테고리 정보 + breadcrumbs 필드 추가)
        return {
            ...category,
            breadcrumbs, // [ {id:5, name:"RUNNING"}, {id:6, name:"신발"} ]
        };
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
                    path: path, // 바꿀 Path가 있는지 확인
                    NOT: { id: id }, // 자기 자신은 제외
                },
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
