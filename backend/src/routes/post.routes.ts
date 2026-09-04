import { Router } from "express";
import * as postController from "../controllers/post.controller";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createPostSchema, updatePostSchema, createCommentSchema, createReportSchema } from "../validators/post.validators";

const router = Router();

router.get("/", optionalAuth, postController.listPosts);
router.post("/", requireAuth, validateBody(createPostSchema), postController.createPost);
router.get("/:id", optionalAuth, postController.getPost);
router.put("/:id", requireAuth, validateBody(updatePostSchema), postController.updatePost);
router.delete("/:id", requireAuth, postController.deletePost);
router.post("/:id/pin", requireAuth, postController.togglePin);

router.post("/:id/like", requireAuth, postController.likePost);
router.delete("/:id/like", requireAuth, postController.unlikePost);
router.post("/:id/share", requireAuth, postController.sharePost);

router.get("/:id/comments", optionalAuth, postController.listComments);
router.post("/:id/comments", requireAuth, validateBody(createCommentSchema), postController.createComment);
router.delete("/:id/comments/:commentId", requireAuth, postController.deleteComment);

router.post("/:id/report", requireAuth, validateBody(createReportSchema.omit({ targetType: true, targetId: true })), postController.reportPost);

export default router;
