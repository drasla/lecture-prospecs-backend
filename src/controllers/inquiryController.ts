import { Request, Response } from 'express';
import { inquiryService } from '../services/inquiryService';
import { InquiryType } from '@prisma/client';

export const inquiryController = {
    createInquiry: async (req: Request, res: Response) => {
        try {
            // 1. 유저 ID 가져오기 (Passport 미들웨어 통과 후)
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            // 2. Body 데이터 추출
            // FormData로 전송되면 req.body에 텍스트 데이터가 들어옵니다.
            const { title, content, type } = req.body;

            // 3. 파일 데이터 추출
            // upload.array()를 썼으므로 req.files는 배열입니다.
            // 타입 단언을 통해 Express.Multer.File[] 임을 명시
            const files = req.files as Express.Multer.File[] | undefined;

            // [유효성 검사]
            if (!title || !content || !type) {
                res.status(400).json({ message: 'Missing required fields' });
                return;
            }

            // [Enum 검증] 들어온 type 문자열이 실제 Enum에 있는지 확인
            if (!Object.values(InquiryType).includes(type as InquiryType)) {
                res.status(400).json({ message: 'Invalid inquiry type' });
                return;
            }

            // 4. 서비스 호출
            const inquiry = await inquiryService.createInquiry({
                userId,
                title,
                content,
                type: type as InquiryType,
                files
            });

            res.status(201).json({
                message: 'Inquiry created successfully',
                inquiry
            });

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(error);
                res.status(500).json({ message: 'Server error', error: error.message });
            }
        }
    }
};