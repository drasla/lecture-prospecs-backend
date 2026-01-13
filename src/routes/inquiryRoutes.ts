import { Router } from 'express';
import multer from 'multer';
import { inquiryController } from '../controllers/inquiryController';
import { authenticateJwt } from '../middlewares/authMiddleware';

const router = Router();

// 메모리 스토리지 (Firebase로 바로 넘기기 위해)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
});

// POST /api/inquiries
// [중요] upload.array('images', 5): 'images'라는 필드명으로 최대 5개 파일 허용
router.post(
    '/',
    authenticateJwt,
    upload.array('images', 5),
    inquiryController.createInquiry
);

export default router;