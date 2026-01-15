import { Router } from 'express';
import { adminProductController } from '../controllers/admin.product.controller';
import { authenticateJwt } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware';

const router = Router();

// 관리자만 접근 가능
router.use(authenticateJwt, isAdmin);

router.post('/', adminProductController.create);
router.get('/', adminProductController.getList);
router.get('/:id', adminProductController.getDetail);
router.put('/:id', adminProductController.update);
router.delete('/:id', adminProductController.delete);

export default router;