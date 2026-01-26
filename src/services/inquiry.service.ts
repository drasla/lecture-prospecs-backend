import { prisma } from '../config/prisma';
import { Inquiry, InquiryType } from '@prisma/client';
import { uploadFileToFirebase } from "../utils/upload.utils";

// 1. 입력 데이터 타입 정의
interface CreateInquiryInput {
    userId: number;
    type: InquiryType; // Enum
    title: string;
    content: string;
    files?: Express.Multer.File[]; // Multer가 처리한 파일 배열
}

export const inquiryService = {
    async createInquiry(data: CreateInquiryInput) {
        // 1. 이미지 파일이 있다면 Firebase에 업로드하고 URL들을 받음
        const imageUrls: string[] = [];

        if (data.files && data.files.length > 0) {
            // Promise.all을 사용하여 병렬 업로드 처리 (속도 향상)
            const uploadPromises = data.files.map(file =>
                uploadFileToFirebase(file, 'inquiries') // 'inquiries' 폴더에 저장
            );
            const urls = await Promise.all(uploadPromises);
            imageUrls.push(...urls);
        }

        // 2. DB에 문의 내용과 이미지 URL을 한 번에 저장 (Transaction)
        // Prisma의 Nested Write 기능을 사용
        const newInquiry = await prisma.inquiry.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                content: data.content,
                // 이미지가 있으면 InquiryImage 테이블에도 같이 insert
                images: {
                    create: imageUrls.map(url => ({ url }))
                }
            },
            include: {
                images: true, // 결과 반환 시 이미지 정보도 포함
            }
        });

        return newInquiry;
    }
};