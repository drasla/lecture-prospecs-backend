import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateJwt } from '../middlewares/authMiddleware'; // 수정한 미들웨어

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// [변경] Passport 기반 인증 미들웨어 적용
router.get('/me', authenticateJwt, authController.getMe);

export default router;