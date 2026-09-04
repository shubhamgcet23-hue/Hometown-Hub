import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth.middleware";
import { upload, fileUrl } from "../middleware/upload.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";

const router = Router();

// Generic authenticated image upload endpoint used by post/community/event/
// profile forms. Returns a URL the client attaches to the relevant resource.
router.post(
  "/image",
  requireAuth,
  upload.single("image"),
    asyncHandler(async (req: AuthedRequest, res) => {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) throw new ApiError(400, "No image file was provided.");
    return success(res, { url: fileUrl(file.filename) }, "Image uploaded.", 201);
  })
);

router.post(
  "/images",
  requireAuth,
  upload.array("images", 6),
    asyncHandler(async (req: AuthedRequest, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    if (!files.length) throw new ApiError(400, "No image files were provided.");
    return success(res, { urls: files.map((f) => fileUrl(f.filename)) }, "Images uploaded.", 201);
  })
);

export default router;
