import admin from "firebase-admin";

const {
    FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_STORAGE_BUCKET,
} = process.env;

const getPrivateKey = (key: string | undefined) => {
    if (!key) return undefined;

    if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
        const decoded = Buffer.from(key, "base64").toString("utf8");
        return decoded.replace(/\\n/g, "\n");
    }

    return key.replace(/\\n/g, "\n");
};

const privateKey = getPrivateKey(FIREBASE_PRIVATE_KEY);

if (!FIREBASE_PROJECT_ID || !privateKey || !FIREBASE_CLIENT_EMAIL) {
    throw new Error("Firebase 환경 변수가 설정되지 않았습니다.");
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: FIREBASE_STORAGE_BUCKET,
});

export const bucket = admin.storage().bucket();
