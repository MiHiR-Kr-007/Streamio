import multer from "multer";
import fs from "fs";
import path from "path";

const tempDir = path.resolve("public", "temp");

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const { fieldname, mimetype } = file;

    const isVideoField = fieldname === "videoFile" && mimetype.startsWith("video/");
    const isImageField =
        ["thumbnail", "image", "avatar", "coverImage"].includes(fieldname) &&
        mimetype.startsWith("image/");

    if (isVideoField || isImageField) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Invalid file type for "${fieldname}". Expected ${
                    fieldname === "videoFile" ? "video" : "image"
                }, received ${mimetype}`
            ),
            false
        );
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 
    }
});
