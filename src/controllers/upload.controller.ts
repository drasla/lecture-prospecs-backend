import { Request, Response, NextFunction } from "express";
import { uploadFileToFirebase } from "../utils/upload.utils";
import { HttpException } from "../utils/exception.utils";

export const uploadController = {
    uploadImage: async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                throw new HttpException(400, "파일이 업로드되지 않았습니다.");
            }

            const folder = req.body.folder || "etc";

            const url = await uploadFileToFirebase(req.file, folder);

            res.status(200).json({ url });
        } catch (error) {
            next(error);
        }
    },
};
