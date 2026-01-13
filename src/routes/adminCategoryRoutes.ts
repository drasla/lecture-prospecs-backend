import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { authenticateJwt } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware';

const router = Router();

// 모든 경로에 공통 미들웨어 적용 (로그인 + 관리자 체크)
router.use(authenticateJwt, isAdmin);

// GET /admin/categories
router.get('/', categoryController.getList);

// POST /admin/categories
router.post('/', categoryController.create);

// PUT /admin/categories/:id
router.put('/:id', categoryController.update);

// DELETE /admin/categories/:id
router.delete('/:id', categoryController.delete);

export default router;