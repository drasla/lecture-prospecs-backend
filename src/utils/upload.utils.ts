import { bucket } from "../config/firebase";
import path from "path";

export const uploadFileToFirebase = async (
    file: Express.Multer.File,
    folder: string,
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const ext = path.extname(file.originalname);
        const filename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

        const blob = bucket.file(filename);

        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on("error", error => {
            reject(error);
        });

        blobStream.on("finish", async () => {
            try {
                await blob.makePublic();
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                resolve(publicUrl);
            } catch (err) {
                reject(err);
            }
        });

        blobStream.end(file.buffer);
    });
};
