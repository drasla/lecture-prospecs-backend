import { Request, Response, NextFunction } from "express";
import { inquiryService } from "../services/inquiry.service";
import { CreateInquiryInput, AnswerInquiryInput } from "../schemas/inquiry.schema";
import { HttpException } from "../utils/exception.utils";
import { InquiryStatus } from "@prisma/client";

export const inquiryController = {
    // [User] 문의 등록
    create: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id; // authenticateJwt 미들웨어를 통과했다고 가정
            const input = req.body as CreateInquiryInput;

            const inquiry = await inquiryService.createInquiry(userId, input);

            res.status(201).json(inquiry);
        } catch (error) {
            next(error);
        }
    },

    // [User] 내 문의 목록 조회
    getMyList: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;

            const result = await inquiryService.getMyInquiries(userId, page, limit);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // [Common] 상세 조회
    getDetail: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) throw new HttpException(400, "Invalid ID format");

            const userId = req.user!.id;
            const userRole = req.user!.role; // "USER" | "ADMIN"

            const inquiry = await inquiryService.getInquiryById(id, userId, userRole);

            res.status(200).json(inquiry);
        } catch (error) {
            next(error);
        }
    },

    // [Admin] 전체 문의 조회
    getAdminList: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const status = req.query.status as InquiryStatus | undefined;

            const result = await inquiryService.getAllInquiries(page, limit, status);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // [Admin] 답변 등록
    answer: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) throw new HttpException(400, "Invalid ID format");

            const input = req.body as AnswerInquiryInput;

            const inquiry = await inquiryService.answerInquiry(id, input);

            res.status(200).json(inquiry);
        } catch (error) {
            next(error);
        }
    },
};
