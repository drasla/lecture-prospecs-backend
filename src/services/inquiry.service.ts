import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { CreateInquiryInput, AnswerInquiryInput } from "../schemas/inquiry.schema";
import { InquiryStatus, Prisma } from "@prisma/client";

export const inquiryService = {
    // ------------------------------------
    // [User] 문의 등록
    // ------------------------------------
    async createInquiry(userId: number, data: CreateInquiryInput) {
        const { type, title, content, images } = data;

        return prisma.inquiry.create({
            data: {
                userId,
                type,
                title,
                content,
                images: {
                    create: images?.map(url => ({ url })) || [],
                },
            },
            include: {
                images: true,
            },
        });
    },

    // ------------------------------------
    // [User] 내 문의 목록 조회
    // ------------------------------------
    async getMyInquiries(userId: number, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [inquiries, total] = await Promise.all([
            prisma.inquiry.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { images: true },
            }),
            prisma.inquiry.count({ where: { userId } }),
        ]);

        return {
            data: inquiries,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    },

    // ------------------------------------
    // [Common] 문의 상세 조회 (권한 체크 포함)
    // ------------------------------------
    async getInquiryById(inquiryId: number, userId: number, userRole: string) {
        const inquiry = await prisma.inquiry.findUnique({
            where: { id: inquiryId },
            include: {
                images: true,
                user: {
                    select: { name: true, email: true },
                },
            },
        });

        if (!inquiry) {
            throw new HttpException(404, "문의 내역을 찾을 수 없습니다.");
        }

        // 권한 체크: 관리자거나, 작성자 본인이어야 함
        if (userRole !== "ADMIN" && inquiry.userId !== userId) {
            throw new HttpException(403, "이 문의 내역에 접근할 권한이 없습니다.");
        }

        return inquiry;
    },

    // ------------------------------------
    // [Admin] 전체 문의 조회
    // ------------------------------------
    async getAllInquiries(page: number, limit: number, status?: InquiryStatus) {
        const skip = (page - 1) * limit;
        const where: Prisma.InquiryWhereInput = status ? { status } : {};

        const [inquiries, total] = await Promise.all([
            prisma.inquiry.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true, email: true } },
                    images: true, // 목록에서 이미지가 필요 없다면 제외 가능
                },
            }),
            prisma.inquiry.count({ where }),
        ]);

        return {
            data: inquiries,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    },

    // ------------------------------------
    // [Admin] 답변 등록/수정
    // ------------------------------------
    async answerInquiry(inquiryId: number, data: AnswerInquiryInput) {
        const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });

        if (!inquiry) {
            throw new HttpException(404, "문의 내역을 찾을 수 없습니다.");
        }

        return prisma.inquiry.update({
            where: { id: inquiryId },
            data: {
                answer: data.answer,
                status: "ANSWERED",
                answeredAt: new Date(),
            },
            include: {
                images: true,
                user: { select: { name: true, email: true } },
            },
        });
    },
};
