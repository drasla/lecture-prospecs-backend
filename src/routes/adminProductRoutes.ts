import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticateJwt } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/adminMiddleware';

const router = Router();

// 관리자만 접근 가능
router.use(authenticateJwt, isAdmin);

router.post('/', productController.create);
router.get('/', productController.getList);
router.get('/:id', productController.getDetail);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

export default router;