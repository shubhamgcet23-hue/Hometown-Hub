import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

// Local-disk storage for development. In production, swap the `storage`
// engine for a Cloudinary/S3 multer-storage adapter and set
// CLOUDINARY_URL / AWS_* env vars; the rest of the app only ever consumes
// the resulting file `url`, so no controller code needs to change.
const uploadPath = path.join(process.cwd(), env.uploadDir);
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new ApiError(400, "Only JPEG, PNG, WEBP or GIF images are allowed."));
    }
    cb(null, true);
  },
});

export function fileUrl(filename: string): string {
  return `${env.backendUrl}/${env.uploadDir}/${filename}`;
}
