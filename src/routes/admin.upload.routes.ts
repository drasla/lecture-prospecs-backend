import { Router, Request, Response } from "express";
import multer from "multer";
import { authenticateJwt } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/adminMiddleware";
import { uploadFileToFirebase } from "../utils/upload.utils";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// [중요] 관리자 인증 미들웨어 적용
router.use(authenticateJwt, isAdmin);

// POST /api/admin/uploads
router.post("/", upload.single("file"), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }

        // 관리자가 올리는 이미지는 'products' 폴더에 저장 (폴더명은 필요에 따라 변경 가능)
        const url = await uploadFileToFirebase(req.file, "products");

        res.status(200).json({ url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Image upload failed" });
    }
});

export default router;
